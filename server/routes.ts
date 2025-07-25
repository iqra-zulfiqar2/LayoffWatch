import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCompanySchema } from "@shared/schema";

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

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
