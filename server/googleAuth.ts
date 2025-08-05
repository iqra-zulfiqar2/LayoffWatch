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

  // Create a dynamic callback URL function instead of static URL
  const getCallbackURL = (req: any) => {
    const protocol = req.protocol || 'https';
    const host = req.get('host') || req.get('x-forwarded-host') || "897be05a-eedd-41cb-a108-3708fd414388-00-3s5emoy4czxac.worf.replit.dev";
    return `${protocol}://${host}/api/auth/google/callback`;
  };
  
  // Use the expected static URL for Passport config
  const callbackURL = "https://897be05a-eedd-41cb-a108-3708fd414388-00-3s5emoy4czxac.worf.replit.dev/api/auth/google/callback";
  
  console.log("Google OAuth callback URL:", callbackURL);
  console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
  console.log("Domain from env:", process.env.REPLIT_DOMAINS);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
        passReqToCallback: true,
      },
      async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
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

  // Manual Google OAuth URL generation to bypass potential caching issues
  app.get("/api/auth/google", (req, res) => {
    const actualHost = req.get('host');
    const actualProtocol = req.protocol;
    const actualCallback = `${actualProtocol}://${actualHost}/api/auth/google/callback`;
    
    console.log("=== Google OAuth Manual Redirect ===");
    console.log("Host:", actualHost);
    console.log("Protocol:", actualProtocol);
    console.log("Callback URL:", actualCallback);
    console.log("Configured URL:", callbackURL);
    console.log("Match:", actualCallback === callbackURL);
    console.log("====================================");
    
    // Manual redirect to Google OAuth with exact parameters
    const googleURL = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `response_type=code&` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(callbackURL)}&` +
      `scope=profile%20email&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=manual_redirect`;
    
    console.log("Redirecting to:", googleURL);
    res.redirect(googleURL);
  });

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

        console.log("Google OAuth successful, redirecting to pricing");
        res.redirect("/pricing");
      } catch (error) {
        console.error("Error in Google OAuth callback:", error);
        res.redirect("/login?error=oauth_failed");
      }
    }
  );
}