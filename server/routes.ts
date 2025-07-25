import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeJobSecurityRisk } from "./anthropic";
import { dataIntegrator } from "./data-integrator";
import { insertCompanySchema, updateUserProfileSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Company routes
  app.get('/api/companies/search', isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      const companies = await storage.searchCompanies(query);
      res.json(companies);
    } catch (error) {
      console.error("Error searching companies:", error);
      res.status(500).json({ message: "Failed to search companies" });
    }
  });

  app.get('/api/companies/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post('/api/companies', isAuthenticated, async (req, res) => {
    try {
      const validated = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validated);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(400).json({ message: "Invalid company data" });
    }
  });

  // User company selection
  app.post('/api/user/select-company', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { companyId } = req.body;
      
      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }

      await storage.updateUserSelectedCompany(userId, companyId);
      res.json({ message: "Company selected successfully" });
    } catch (error) {
      console.error("Error selecting company:", error);
      res.status(500).json({ message: "Failed to select company" });
    }
  });

  // Dashboard stats - public access for homepage
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await storage.getCompaniesWithLayoffStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Notifications
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Company activities
  app.get('/api/companies/:id/activities', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const activities = await storage.getCompanyActivities(id);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching company activities:", error);
      res.status(500).json({ message: "Failed to fetch company activities" });
    }
  });

  // Layoff events
  app.get('/api/companies/:id/layoffs', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const layoffs = await storage.getLayoffEventsByCompany(id);
      res.json(layoffs);
    } catch (error) {
      console.error("Error fetching layoff events:", error);
      res.status(500).json({ message: "Failed to fetch layoff events" });
    }
  });

  // User profile management
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = updateUserProfileSchema.parse(req.body);
      const user = await storage.updateUserProfile(userId, validated);
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(400).json({ message: "Invalid profile data" });
    }
  });

  // Historical layoff data - public access for homepage
  app.get('/api/analytics/historical', async (req, res) => {
    try {
      const historicalData = await storage.getHistoricalLayoffData();
      res.json(historicalData);
    } catch (error) {
      console.error("Error fetching historical layoff data:", error);
      res.status(500).json({ message: "Failed to fetch historical data" });
    }
  });

  // Layoff trends - public access for homepage  
  app.get('/api/analytics/trends', async (req, res) => {
    try {
      const timeframe = (req.query.timeframe as 'month' | 'quarter' | 'year') || 'month';
      const trends = await storage.getLayoffTrends(timeframe);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching layoff trends:", error);
      res.status(500).json({ message: "Failed to fetch trends" });
    }
  });

  // Recent layoffs endpoint
  app.get('/api/layoffs/recent', async (req, res) => {
    try {
      const recentLayoffs = await storage.getRecentLayoffs();
      res.json(recentLayoffs);
    } catch (error) {
      console.error("Error fetching recent layoffs:", error);
      res.status(500).json({ message: "Failed to fetch recent layoffs" });
    }
  });

  // Companies endpoint
  app.get('/api/companies', async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Subscription management endpoints
  app.post('/api/subscription/upgrade', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { plan } = req.body;
      
      // For now, just update the user's plan (would integrate with Stripe)
      await storage.updateUserSubscription(userId, plan);
      
      res.json({ 
        success: true, 
        message: `Successfully upgraded to ${plan} plan`,
        requiresPayment: plan !== "free"
      });
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      res.status(500).json({ message: "Failed to upgrade subscription" });
    }
  });

  app.post('/api/subscription/update', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { companies, email, phoneNumber, emailNotifications, smsNotifications } = req.body;
      
      // Update user profile
      await storage.updateUserProfile(userId, {
        email,
        phoneNumber,
        emailNotifications,
        smsNotifications,
      });
      
      // Update company subscriptions
      await storage.updateUserCompanySubscriptions(userId, companies);
      
      res.json({ success: true, message: "Subscription updated successfully" });
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  app.get('/api/user/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getUserCompanySubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching user subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // Data integration endpoint
  app.post("/api/integrate-data", isAuthenticated, async (req, res) => {
    try {
      console.log("Starting data integration...");
      await dataIntegrator.integrateAllData();
      res.json({ message: "Data integration completed successfully" });
    } catch (error: any) {
      console.error("Data integration failed:", error);
      res.status(500).json({ message: "Data integration failed", error: error?.message });
    }
  });

  // Get data sources info
  app.get("/api/data-sources", async (req, res) => {
    res.json({
      sources: [
        {
          name: "layoffs.fyi",
          description: "Tech industry layoffs tracker with 759K+ employees from 2,813 companies since 2020",
          coverage: "Technology sector focused",
          dataPoints: "759,382 employees affected",
          lastUpdate: "Real-time"
        },
        {
          name: "warntracker.com", 
          description: "WARN Act layoff notices tracker with comprehensive coverage since 1988",
          coverage: "All industries, all states",
          dataPoints: "7.1M+ employees, 36,237 companies",
          lastUpdate: "Government filings"
        },
        {
          name: "layoffdata.com",
          description: "Government WARN Act data aggregator with detailed layoff information",
          coverage: "49 states, all industries",
          dataPoints: "78K+ layoff notices, 8.5M+ workers",
          lastUpdate: "State government data"
        }
      ],
      totalCoverage: {
        employees: "15.5M+",
        companies: "42K+",
        timespan: "Since 1988"
      }
    });
  });

  // Risk Analysis API
  app.post("/api/risk-analysis", async (req, res) => {
    try {
      const { jobTitle, companyName, yearsExperience, currentSkills, industry } = req.body;
      
      if (!jobTitle || !companyName) {
        return res.status(400).json({ 
          message: "Job title and company name are required" 
        });
      }

      const analysis = await analyzeJobSecurityRisk({
        jobTitle,
        companyName,
        yearsExperience,
        currentSkills,
        industry
      });

      res.json(analysis);
    } catch (error) {
      console.error("Error in risk analysis:", error);
      res.status(500).json({ 
        message: "Failed to analyze job security risk",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
