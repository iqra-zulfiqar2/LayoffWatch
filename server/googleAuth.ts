import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";
import session from "express-session";

export function setupGoogleAuth(app: Express) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("Google OAuth credentials not found. Google authentication disabled.");
    return;
  }

  // Configure Google OAuth strategy
  // Use the actual current domain for the callback URL
  const currentDomain = "68482c38-d023-4f10-a347-9fe6938380c4.worf.prod.repl.run";
  const callbackURL = `https://${currentDomain}/api/auth/google/callback`;
  
  console.log("Google OAuth callback URL:", callbackURL);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          // Check if user already exists
          let user = await storage.getUserByEmail(email);
          
          if (user) {
            // Update last login and auth provider if needed
            if (user.authProvider !== "google") {
              // Update auth provider to google for existing users
              user = await storage.updateUser(user.id, { 
                authProvider: "google",
                lastLoginAt: new Date(),
                updatedAt: new Date(),
              });
            } else {
              await storage.updateUserLastLogin(user.id);
              user = await storage.getUser(user.id);
            }
          } else {
            // Create new user with Google data
            const firstName = profile.name?.givenName || "";
            const lastName = profile.name?.familyName || "";
            const profileImageUrl = profile.photos?.[0]?.value || "";

            user = await storage.createEmailUser({
              firstName,
              lastName,
              email,
              password: "", // No password for Google OAuth users
              authProvider: "google",
              isEmailVerified: true, // Google emails are pre-verified
            });

            // Update profile image if available
            if (profileImageUrl) {
              user = await storage.updateUser(user.id, { 
                profileImageUrl,
                updatedAt: new Date(),
              });
            }
          }

          return done(null, user);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error);
        }
      }
    )
  );

  // Google OAuth routes
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { session: false }),
    async (req: any, res) => {
      try {
        if (!req.user) {
          console.error("No user in Google OAuth callback");
          return res.redirect("/login?error=oauth_failed");
        }

        // Create session like in password auth
        req.session.user = {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          authProvider: 'google'
        };

        await new Promise<void>((resolve, reject) => {
          req.session.save((err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });

        console.log("Google OAuth successful, redirecting to home");
        res.redirect("/");
      } catch (error) {
        console.error("Error in Google OAuth callback:", error);
        res.redirect("/login?error=oauth_failed");
      }
    }
  );
}