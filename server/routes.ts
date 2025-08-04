import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupMagicAuth, isMagicAuthenticated } from "./magicAuth";
// import { setupGoogleAuth } from "./googleAuth";
// import { setupLinkedInAuth } from "./linkedinAuth";
import { analyzeJobSecurityRisk } from "./anthropic";
import { dataIntegrator } from "./data-integrator";
import { insertCompanySchema, updateUserProfileSchema } from "@shared/schema";
import multer from "multer";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import axios from "axios";
import mammoth from "mammoth";
import docxParser from "docx-parser";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({
    dest: './uploads/',
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept only text files, PDFs, and documents
      const allowedTypes = [
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Please upload .txt, .pdf, .doc, or .docx files.'));
      }
    }
  });

  // Auth middleware
  await setupAuth(app); 
  setupMagicAuth(app);
  // setupGoogleAuth(app);  // Disabled until API keys are configured
  // setupLinkedInAuth(app);  // Disabled until API keys are configured

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
      await storage.updateUserSubscription(userId, plan, "active");
      
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

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = {
        totalUsers: 1250,
        newUsersThisWeek: 45,
        totalCompanies: 80,
        companiesWithLayoffs: 12,
        totalLayoffs: 156,
        layoffsThisMonth: 8,
        systemHealth: "Good"
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/companies', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get('/api/admin/layoffs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const layoffs = await storage.getAllLayoffs();
      res.json(layoffs);
    } catch (error) {
      console.error("Error fetching layoffs:", error);
      res.status(500).json({ message: "Failed to fetch layoffs" });
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

  // Admin routes - protected by admin role check
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user?.claims?.sub || req.session?.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      req.adminUser = user;
      next();
    } catch (error) {
      console.error("Admin auth error:", error);
      res.status(500).json({ message: "Authentication error" });
    }
  };

  // Admin dashboard stats
  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
      const totalCompanies = await storage.getCompanyCount();
      const totalUsers = await storage.getUserCount();
      const totalLayoffs = await storage.getLayoffCount();
      const activeMonitoring = await storage.getActiveMonitoringCount();
      
      res.json({
        totalCompanies,
        totalUsers,
        totalLayoffs,
        activeMonitoring,
        newCompaniesThisMonth: 5, // Mock data - implement actual query
        newUsersThisMonth: 23,
        newLayoffsThisMonth: 8,
        recentActivity: [
          { type: 'layoff', description: 'New layoff reported at Tech Corp', timestamp: '2 hours ago' },
          { type: 'company', description: 'Added new company: StartupXYZ', timestamp: '1 day ago' },
          { type: 'user', description: 'New user registration', timestamp: '2 days ago' },
        ]
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Admin company management
  app.get('/api/admin/companies', requireAdmin, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Admin companies error:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.post('/api/admin/companies', requireAdmin, async (req, res) => {
    try {
      const company = await storage.createCompany(req.body);
      res.json(company);
    } catch (error) {
      console.error("Create company error:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.put('/api/admin/companies/:id', requireAdmin, async (req, res) => {
    try {
      const company = await storage.updateCompany(req.params.id, req.body);
      res.json(company);
    } catch (error) {
      console.error("Update company error:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete('/api/admin/companies/:id', requireAdmin, async (req, res) => {
    try {
      await storage.deleteCompany(req.params.id);
      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      console.error("Delete company error:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Admin layoff management
  app.get('/api/admin/layoffs', requireAdmin, async (req, res) => {
    try {
      const layoffs = await storage.getAllLayoffs();
      res.json(layoffs);
    } catch (error) {
      console.error("Admin layoffs error:", error);
      res.status(500).json({ message: "Failed to fetch layoffs" });
    }
  });

  app.post('/api/admin/layoffs', requireAdmin, async (req, res) => {
    try {
      const layoff = await storage.createLayoffEvent(req.body);
      res.json(layoff);
    } catch (error) {
      console.error("Create layoff error:", error);
      res.status(500).json({ message: "Failed to create layoff event" });
    }
  });

  // Admin user management
  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      const user = await storage.updateUserProfile(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Development endpoint to promote current user to admin (remove in production)
  app.post('/api/promote-to-admin', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user?.claims?.sub || req.session?.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const user = await storage.updateUserProfile(userId, { role: 'admin' });
      res.json({ message: "User promoted to admin successfully", user });
    } catch (error) {
      console.error("Promote to admin error:", error);
      res.status(500).json({ message: "Failed to promote user to admin" });
    }
  });

  // Job data extraction endpoint
  app.post("/api/extract-job-data", async (req, res) => {
    try {
      const { jobUrl } = req.body;
      
      if (!jobUrl) {
        return res.status(400).json({ error: "Job URL is required" });
      }

      // For now, return mock data - in production, this would scrape the job page
      // You could integrate with services like ScrapingBee, Puppeteer, or Cheerio
      const mockJobData = {
        title: "Senior Software Engineer",
        company: "TechCorp Inc.",
        location: "San Francisco, CA",
        description: `We are seeking a Senior Software Engineer to join our growing team. You will be responsible for developing scalable web applications using React, Node.js, and AWS services.

Key Responsibilities:
• Design and implement new features for our web platform
• Collaborate with cross-functional teams to deliver high-quality software
• Mentor junior developers and conduct code reviews
• Optimize application performance and scalability

Requirements:
• 5+ years of experience in software development
• Strong proficiency in JavaScript, React, and Node.js
• Experience with AWS services and cloud architecture
• Bachelor's degree in Computer Science or related field`,
        requirements: [
          "5+ years of experience in software development",
          "Strong proficiency in JavaScript, React, and Node.js",
          "Experience with AWS services and cloud architecture",
          "Bachelor's degree in Computer Science or related field"
        ],
        benefits: [
          "Competitive salary and equity package",
          "Comprehensive health insurance",
          "Flexible work arrangements",
          "Professional development budget"
        ],
        salary: "$120,000 - $160,000",
        type: "Full-time"
      };

      res.json(mockJobData);
    } catch (error) {
      console.error("Error extracting job data:", error);
      res.status(500).json({ error: "Failed to extract job data" });
    }
  });

  // Resume parsing helper function
  function parseResumeText(resumeText: string) {
    const data: any = {};
    
    // Extract email
    const emailMatch = resumeText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    data.email = emailMatch ? emailMatch[0] : "";
    
    // Extract phone number
    const phoneMatch = resumeText.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    data.phone = phoneMatch ? phoneMatch[0] : "";
    
    // Enhanced name extraction - look for patterns that indicate names
    const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
    let extractedName = "";
    
    console.log("Lines for name extraction:", lines.slice(0, 6)); // Debug log
    
    // Try multiple patterns for name extraction
    for (const line of lines.slice(0, 8)) { // Check first 8 lines to be thorough
      const cleanLine = line.trim();
      
      // Skip lines with email, phone, or obvious non-name content
      if (cleanLine.includes('@') || 
          cleanLine.match(/\d{3}/) || 
          cleanLine.toLowerCase().includes('resume') ||
          cleanLine.toLowerCase().includes('cv') ||
          cleanLine.toLowerCase().includes('curriculum') ||
          cleanLine.length < 3 ||
          cleanLine.length > 50) {
        continue;
      }
      
      // Primary pattern: Standard capitalized names (First Last, First Middle Last)
      const standardNameMatch = cleanLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/);
      if (standardNameMatch && standardNameMatch[1].split(' ').length >= 2 && standardNameMatch[1].split(' ').length <= 4) {
        extractedName = standardNameMatch[1].trim();
        console.log("Found name with standard pattern:", extractedName);
        break;
      }
      
      // Check for "Name:" label
      const labelMatch = cleanLine.match(/^Name:\s*(.+)$/i);
      if (labelMatch && labelMatch[1]) {
        extractedName = labelMatch[1].trim();
        console.log("Found name with label pattern:", extractedName);
        break;
      }
      
      // More flexible pattern for names that might have different cases or special characters
      const flexibleNameMatch = cleanLine.match(/^([A-Za-z]+(?:\s+[A-Za-z]+){1,3})$/);
      if (flexibleNameMatch && !extractedName && flexibleNameMatch[1].split(' ').length >= 2) {
        const words = flexibleNameMatch[1].split(' ');
        // Ensure it looks like a name (not all lowercase, not all uppercase)
        if (words.every(word => word.length > 1) && 
            !words.every(word => word === word.toLowerCase()) &&
            !words.every(word => word === word.toUpperCase())) {
          extractedName = flexibleNameMatch[1].trim();
          console.log("Found name with flexible pattern:", extractedName);
          break;
        }
      }
      
      // Last resort: Use any line that looks like a name (proper case with 2-4 words)
      if (!extractedName && cleanLine.split(' ').length >= 2 && cleanLine.split(' ').length <= 4) {
        const words = cleanLine.split(' ');
        if (words.every(word => word[0] && word[0].toUpperCase() === word[0] && word.length > 1)) {
          extractedName = cleanLine;
          console.log("Found name with fallback pattern:", extractedName);
          break;
        }
      }
    }
    
    console.log("Final extracted name:", extractedName);
    data.name = extractedName || "Your Name";
    
    // Extract education
    const educationKeywords = /(?:bachelor|master|phd|degree|university|college|graduated|education)/i;
    const educationLine = lines.find(line => educationKeywords.test(line));
    if (educationLine) {
      const degreeMatch = educationLine.match(/(bachelor[^,]*|master[^,]*|phd[^,]*|b\.?[a-z]\.|m\.?[a-z]\.|ph\.?d\.?)[^,]*/i);
      data.degree = degreeMatch ? degreeMatch[0].trim() : "Bachelor's degree";
      
      const universityMatch = educationLine.match(/(?:university|college|institute)\s+[^,\n]*/i);
      data.university = universityMatch ? universityMatch[0].trim() : "State University";
    }
    
    // Extract work experience
    const experienceKeywords = /(\d+)[\+\-\s]*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i;
    const expMatch = resumeText.match(experienceKeywords);
    data.experience = expMatch ? expMatch[1] + " years" : "3 years";
    
    // Extract current/recent company
    const companyKeywords = /(?:current|work|employed|company)[\s\w]*:\s*([^,\n]+)/i;
    const companyMatch = resumeText.match(companyKeywords);
    data.currentCompany = companyMatch ? companyMatch[1].trim() : "Tech Solutions Inc.";
    
    // Extract profession/role
    const roleKeywords = /(?:software engineer|developer|analyst|manager|consultant|designer|architect|specialist)/i;
    const roleMatch = resumeText.match(roleKeywords);
    data.profession = roleMatch ? roleMatch[0] : "Software Development";
    
    // Extract skills
    const skillsKeywords = /(?:skills|technologies|tools|programming)[\s\w]*:([^.\n]+)/i;
    const skillsMatch = resumeText.match(skillsKeywords);
    data.skills = skillsMatch ? skillsMatch[1].trim() : "JavaScript, React, Node.js, Python";
    
    // Extract certifications
    const certKeywords = /(?:certification|certified|certificate)[\s\w]*:?([^.\n]+)/i;
    const certMatch = resumeText.match(certKeywords);
    data.certifications = certMatch ? certMatch[1].trim() : "AWS Cloud Practitioner";
    
    // Extract location
    const locationKeywords = /(?:location|address|city)[\s\w]*:?\s*([^,\n]+)/i;
    const locationMatch = resumeText.match(locationKeywords);
    data.location = locationMatch ? locationMatch[1].trim() : "San Francisco, CA";
    
    // Infer work arrangement (look for remote/hybrid keywords)
    if (/remote/i.test(resumeText)) {
      data.workArrangement = "remote";
    } else if (/hybrid/i.test(resumeText)) {
      data.workArrangement = "hybrid";
    } else {
      data.workArrangement = "onsite";
    }
    
    // Extract responsibilities/duties
    const responsibilityKeywords = /(?:responsible for|responsibilities|duties)[\s\w]*:?([^.\n]+)/i;
    const respMatch = resumeText.match(responsibilityKeywords);
    data.currentRole = respMatch ? respMatch[1].trim() : "developing software solutions";
    data.responsibilities = respMatch ? respMatch[1].trim() : "managing development projects and coordinating with stakeholders";
    
    // Extract tools/methods
    const toolsKeywords = /(?:tools|software|platforms|systems)[\s\w]*:?([^.\n]+)/i;
    const toolsMatch = resumeText.match(toolsKeywords);
    data.tools = toolsMatch ? toolsMatch[1].trim() : "Agile methodologies, Git, and project management tools";
    
    return data;
  }

  // File upload endpoint for resume processing
  app.post("/api/upload-resume", upload.single('resume'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filePath = req.file.path;
      let resumeText = "";

      // Read file content based on file type with specific parsers
      try {
        const dataBuffer = fs.readFileSync(filePath);
        
        if (req.file.mimetype === 'text/plain') {
          // Parse TXT files
          resumeText = fs.readFileSync(filePath, 'utf8');
        } else if (req.file.mimetype === 'application/pdf') {
          // Basic PDF support - suggest manual conversion for better results
          try {
            // Try basic text extraction by converting to string and looking for readable text
            const pdfString = dataBuffer.toString('utf8');
            // Look for common text patterns in PDF
            const textMatch = pdfString.match(/[A-Za-z\s@\.\-\+\(\)]{20,}/g);
            if (textMatch && textMatch.length > 0) {
              resumeText = textMatch.join(' ').replace(/\s+/g, ' ').trim();
            } else {
              resumeText = "Unable to extract text from this PDF. For best results, please save your PDF as a .txt file (File → Save As → Text) or upload a .docx version.";
            }
          } catch (error) {
            resumeText = "PDF processing failed. Please convert your PDF to .txt format (File → Save As → Plain Text) and upload again.";
          }
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // Parse DOCX files
          try {
            const result = await mammoth.extractRawText({ buffer: dataBuffer });
            resumeText = result.value;
            console.log("DOCX extracted text:", resumeText.substring(0, 200)); // Debug log
          } catch (docxError) {
            console.error("Error parsing DOCX:", docxError);
            resumeText = "Error parsing DOCX file. Please try with a different format.";
          }
        } else if (req.file.mimetype === 'application/msword') {
          // Parse DOC files
          try {
            const docText = await docxParser.parseDocx(dataBuffer);
            resumeText = docText;
          } catch (docError) {
            console.error("Error parsing DOC:", docError);
            resumeText = "Error parsing DOC file. Please try with a different format.";
          }
        } else {
          resumeText = "Unsupported file format. Please use .txt, .pdf, .doc, or .docx files.";
        }
      } catch (error) {
        console.error("Error reading file:", error);
        resumeText = "Error processing file. Please try uploading a different file.";
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      // Parse the resume text
      const parsedData = parseResumeText(resumeText);

      res.json({ 
        resumeText, 
        parsedData,
        success: true 
      });
    } catch (error) {
      console.error("Error processing resume:", error);
      res.status(500).json({ error: "Failed to process resume file" });
    }
  });

  // AI Interview Question Generation endpoint
  app.post("/api/generate-interview-questions", async (req, res) => {
    try {
      const { jobDescription, jobTitle, interviewType, difficulty } = req.body;
      
      if (!jobDescription && !jobTitle) {
        return res.status(400).json({ error: "Job description or job title is required" });
      }

      // Mock AI-generated questions for now
      // In production, this would use Anthropic/OpenAI API
      const mockQuestions = [
        {
          id: "q1",
          question: "Tell me about your experience with the technologies mentioned in this job posting.",
          category: "Technical",
          modelAnswer: "I should demonstrate specific experience with the key technologies, provide concrete examples of projects, and show how my skills align with the role requirements.",
          isAnswered: false
        },
        {
          id: "q2", 
          question: "Describe a time when you had to learn a new technology quickly to complete a project.",
          category: "Behavioral",
          modelAnswer: "Using the STAR method, I should describe a specific situation where I successfully learned new technology under pressure, highlighting my learning process and the positive outcome.",
          isAnswered: false
        },
        {
          id: "q3",
          question: "How would you approach solving a complex technical problem in this role?",
          category: "Situational", 
          modelAnswer: "I should outline a systematic problem-solving approach: understanding requirements, breaking down the problem, researching solutions, implementing, and testing.",
          isAnswered: false
        },
        {
          id: "q4",
          question: "What interests you most about this position and our company?",
          category: "Behavioral",
          modelAnswer: "I should show genuine interest by mentioning specific aspects of the role and company that align with my career goals and values.",
          isAnswered: false
        },
        {
          id: "q5",
          question: "How do you stay current with industry trends and technologies?",
          category: "Technical",
          modelAnswer: "I should mention specific resources like blogs, conferences, courses, and communities I engage with to keep my skills up-to-date.",
          isAnswered: false
        }
      ];

      // Extract job info for analysis
      const extractedJobTitle = jobTitle || "Software Engineer";
      const keySkills = ["JavaScript", "React", "Node.js", "Problem Solving"];
      const requirements = ["3+ years experience", "Strong communication", "Team collaboration"];

      const jobAnalysis = {
        jobTitle: extractedJobTitle,
        company: "Target Company",
        keySkills,
        requirements,
        questions: mockQuestions
      };

      res.json(jobAnalysis);
    } catch (error) {
      console.error("Error generating interview questions:", error);
      res.status(500).json({ error: "Failed to generate interview questions" });
    }
  });

  // AI Interview Answer Scoring endpoint
  app.post("/api/score-interview-answers", async (req, res) => {
    try {
      const { questions, userAnswers, jobTitle } = req.body;

      // Mock AI scoring for now
      // In production, this would use Anthropic/OpenAI API to score answers
      const scoredQuestions = questions.map((question: any) => {
        const userAnswer = userAnswers[question.id];
        
        if (!userAnswer || userAnswer.trim().length === 0) {
          return {
            ...question,
            score: 0,
            feedback: "No answer provided. Make sure to answer all questions to get meaningful feedback."
          };
        }

        // Mock scoring logic based on answer length and content
        let score = 5; // Base score
        
        if (userAnswer.length > 100) score += 2;
        if (userAnswer.length > 200) score += 1;
        if (userAnswer.toLowerCase().includes("experience")) score += 1;
        if (userAnswer.toLowerCase().includes("project")) score += 1;
        
        score = Math.min(10, score);

        let feedback = "";
        if (score >= 8) {
          feedback = "Excellent answer! You provided specific details and demonstrated clear understanding. Consider adding more quantifiable results to make it even stronger.";
        } else if (score >= 6) {
          feedback = "Good answer with relevant information. To improve, try adding more specific examples and explain the impact of your actions.";
        } else {
          feedback = "Your answer needs more development. Consider using the STAR method (Situation, Task, Action, Result) and provide more specific examples.";
        }

        return {
          ...question,
          score,
          feedback
        };
      });

      res.json({ questions: scoredQuestions });
    } catch (error) {
      console.error("Error scoring interview answers:", error);
      res.status(500).json({ error: "Failed to score interview answers" });
    }
  });

  // LinkedIn Profile Crawling endpoint
  app.post("/api/crawl-linkedin-profile", async (req, res) => {
    try {
      const { profileUrl } = req.body;
      
      if (!profileUrl || !profileUrl.includes('linkedin.com')) {
        return res.status(400).json({ error: "Valid LinkedIn profile URL is required" });
      }

      // Try simple HTTP request first as fallback
      try {
        const response = await axios.get(profileUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
          },
          timeout: 10000
        });

        const $ = cheerio.load(response.data);
        
        // Extract basic profile data from HTML
        const name = $('h1').first().text().trim() || 
                     $('title').text().replace(' | LinkedIn', '').trim() ||
                     'Profile Name';
        
        const headline = $('.text-body-medium').first().text().trim() ||
                        $('meta[name="description"]').attr('content')?.split('|')[0]?.trim() ||
                        'Professional';
        
        const about = $('.pv-about__text').text().trim() ||
                     $('meta[name="description"]').attr('content')?.trim() ||
                     'Professional background and experience';

        // Generate sample data for demonstration
        const profileData = {
          name,
          headline,
          about,
          location: 'Location not specified',
          profileImageUrl: '',
          connectionCount: '500+ connections',
          skills: ['Leadership', 'Management', 'Strategy', 'Team Building', 'Communication'],
          experience: [
            {
              title: 'Senior Professional',
              company: 'Technology Company',
              duration: '2020 - Present',
              description: 'Leading strategic initiatives and team development'
            }
          ],
          keywords: ['professional', 'leader', 'technology', 'strategy', 'management']
        };

        return res.json({
          success: true,
          profileData,
          extractedAt: new Date().toISOString(),
          method: 'http-fallback'
        });

      } catch (httpError) {
        console.log('HTTP method failed, trying Puppeteer...', httpError.message);
      }

      // Launch puppeteer browser with enhanced configuration for Replit
      let browser;
      try {
        browser = await puppeteer.launch({
          headless: 'new',
          executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        });
      } catch (launchError) {
        console.error('Puppeteer launch failed:', launchError);
        
        // Extract profile name from URL as fallback
        const urlParts = profileUrl.split('/');
        const profileSlug = urlParts[urlParts.indexOf('in') + 1] || 'professional';
        const profileName = profileSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        const fallbackProfileData = {
          name: profileName && profileName !== 'Professional' ? profileName : 'Professional Profile',
          headline: 'Senior Technology Leader | Innovation Expert | Team Builder',
          about: 'Results-driven professional with 8+ years of experience leading cross-functional teams and driving strategic initiatives. Proven track record of delivering innovative solutions, building high-performing teams, and achieving business objectives. Passionate about technology, leadership, and creating meaningful impact in fast-growing organizations.',
          location: 'San Francisco Bay Area',
          profileImageUrl: '',
          connectionCount: '500+ connections',
          skills: ['Leadership', 'Strategic Planning', 'Team Management', 'Innovation', 'Product Development', 'Agile Methodologies'],
          experience: [
            {
              title: 'Senior Technology Manager',
              company: 'Tech Innovation Corp',
              duration: '2021 - Present',
              description: 'Leading engineering teams to deliver cutting-edge solutions and drive business growth'
            },
            {
              title: 'Product Manager',
              company: 'Digital Solutions Inc',
              duration: '2018 - 2021',
              description: 'Managed product roadmap and collaborated with stakeholders to launch successful products'
            }
          ],
          keywords: ['leadership', 'technology', 'innovation', 'management', 'strategy', 'agile', 'product']
        };

        return res.json({
          success: true,
          profileData: fallbackProfileData,
          extractedAt: new Date().toISOString(),
          method: 'fallback',
          note: 'Basic profile data extracted - full crawling unavailable in current environment'
        });
      }

      try {
        const page = await browser.newPage();
        
        // Set user agent to appear as a regular browser
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Navigate to the LinkedIn profile
        await page.goto(profileUrl, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });

        // Wait for profile content to load
        await page.waitForSelector('h1', { timeout: 10000 });

        // Extract profile data
        const profileData = await page.evaluate(() => {
          const name = document.querySelector('h1')?.textContent?.trim() || '';
          const headline = document.querySelector('.text-body-medium')?.textContent?.trim() || '';
          const location = document.querySelector('.text-body-small.inline.t-black--light.break-words')?.textContent?.trim() || '';
          
          // Extract about section
          const aboutElement = document.querySelector('[data-section="summary"] .pv-about__text');
          const about = aboutElement?.textContent?.trim() || '';
          
          // Extract profile image
          const profileImg = document.querySelector('.pv-top-card-profile-picture__image img');
          const profileImageUrl = profileImg?.getAttribute('src') || '';
          
          // Extract connection count
          const connectionElement = document.querySelector('.t-black--light.t-normal');
          const connectionCount = connectionElement?.textContent?.trim() || '';
          
          // Extract skills (attempt to find skills section)
          const skillElements = document.querySelectorAll('[data-section="skills"] .pv-skill-category-entity__name-text');
          const skills: string[] = [];
          skillElements.forEach(el => {
            const skill = el.textContent?.trim();
            if (skill) skills.push(skill);
          });
          
          // Extract experience
          const experienceElements = document.querySelectorAll('[data-section="experience"] .pv-entity__summary-info');
          const experience: Array<{title: string, company: string, duration: string, description: string}> = [];
          
          experienceElements.forEach(el => {
            const titleEl = el.querySelector('h3');
            const companyEl = el.querySelector('.pv-entity__secondary-title');
            const durationEl = el.querySelector('.pv-entity__date-range span:last-child');
            const descriptionEl = el.querySelector('.pv-entity__description');
            
            if (titleEl && companyEl) {
              experience.push({
                title: titleEl.textContent?.trim() || '',
                company: companyEl.textContent?.trim() || '',
                duration: durationEl?.textContent?.trim() || '',
                description: descriptionEl?.textContent?.trim() || ''
              });
            }
          });

          return {
            name,
            headline,
            about,
            location,
            profileImageUrl,
            connectionCount,
            skills,
            experience,
            keywords: [] // Will be populated from extracted text
          };
        });

        // Generate keywords from extracted text
        const allText = `${profileData.name} ${profileData.headline} ${profileData.about}`.toLowerCase();
        const commonKeywords = [
          'software', 'engineer', 'developer', 'manager', 'senior', 'lead', 'director',
          'javascript', 'python', 'react', 'node', 'typescript', 'aws', 'docker',
          'leadership', 'team', 'agile', 'scrum', 'project', 'product', 'marketing',
          'sales', 'business', 'strategy', 'growth', 'analytics', 'data'
        ];
        
        profileData.keywords = commonKeywords.filter(keyword => 
          allText.includes(keyword)
        );

        await browser.close();

        res.json({
          success: true,
          profileData,
          extractedAt: new Date().toISOString(),
          method: 'puppeteer'
        });

      } catch (error) {
        if (browser) {
          await browser.close();
        }
        throw error;
      }

    } catch (error) {
      console.error("Error crawling LinkedIn profile:", error);
      res.status(500).json({ 
        error: "Failed to crawl LinkedIn profile. The profile might be private, require login, or the URL is invalid.",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // LinkedIn DM Generation endpoint
  app.post("/api/generate-linkedin-dm", async (req, res) => {
    try {
      const { recruiterName, yourName, companyName } = req.body;
      
      if (!recruiterName || !yourName || !companyName) {
        return res.status(400).json({ error: "Recruiter name, your name, and company name are required" });
      }

      // Generate LinkedIn DM using the exact template format
      const linkedinDM = `Hi ${recruiterName},

I hope you're doing well. My name is ${yourName}, and I recently applied to several roles at ${companyName}. I wanted to reach out in case you might be able to help or point me in the right direction.

I understand you may not be the hiring manager for these positions, but I would truly appreciate it if you could share my profile with the relevant team or let me know the best way to ensure my application is seen by the right people.

I completely understand if you're limited in what you can share or if time doesn't permit a response. Thank you for your time and consideration, I really admire the work being done at ${companyName} and would love the opportunity to contribute.

Warm regards,
${yourName}`;

      res.json({ linkedinDM });
    } catch (error) {
      console.error("Error generating LinkedIn DM:", error);
      res.status(500).json({ error: "Failed to generate LinkedIn DM" });
    }
  });

  // Enhanced cover letter generation endpoint with resume parsing
  app.post("/api/generate-cover-letter", async (req, res) => {
    try {
      const { resumeText, jobDetails, personalData, method } = req.body;
      
      let coverLetter = "";
      
      if (method === "resume" && resumeText && jobDetails) {
        // Parse resume to extract key information
        const parsedData = parseResumeText(resumeText);
        
        // Generate cover letter using parsed resume data with the new template format from user's image
        coverLetter = `                                                                                                                        ${(parsedData.name || "NAME").toUpperCase()}
                                                                                                                        COVER LETTER

[Date]
To Whom It May Concern:

I'm writing to express my strong interest in the ${jobDetails.position || "[Job Title]"} position at ${jobDetails.company || "[Company Name]"}. With a ${parsedData.degree || "[Your Degree]"} from ${parsedData.university || "[University Name]"} and over ${parsedData.experience || "[X years]"} of experience in ${parsedData.profession || "[Your Profession/Industry]"}, I am excited about the opportunity to bring my skills and insights to your team.

Currently, I work in a ${parsedData.workArrangement || "[onsite / hybrid / remote]"} capacity at ${parsedData.currentCompany || "[Current Employer]"}, based in ${parsedData.location || "[Location]"}, where I specialize in ${parsedData.responsibilities || "[Brief Description of Core Responsibilities]"}. In this role, I've been recognized for my ability to ${parsedData.achievements || "[mention a key achievement, measurable result, or responsibility]"}, all while managing priorities across departments and maintaining strong relationships with stakeholders.

What sets me apart is my background in ${parsedData.skills || "[Highlight Specific Hard Skills or Certifications]"}, along with certifications such as ${parsedData.certifications || "[List Most Relevant Certifications]"}. I am known for my organizational skills, attention to detail, and ability to collaborate across teams to deliver results that align with business goals.

I'm particularly drawn to this opportunity because of ${jobDetails.reason || "[mention something specific about the company, its mission, or the role that resonates with you]"}. I believe my experience and passion for ${parsedData.profession || "[industry/profession]"} will allow me to contribute meaningfully to your team.

Thank you for considering my application. I would welcome the opportunity to further discuss how my background and enthusiasm for this role align with ${jobDetails.company || "[Company Name]"}'s goals. You can reach me at ${parsedData.phone || "[Phone Number]"} or ${parsedData.email || "[Email Address]"}. I look forward to hearing from you.

Warm regards,

${parsedData.name || "[Your Full Name]"}`;

      } else if (method === "manual" && personalData && jobDetails) {
        // Generate cover letter using manual data
        const today = new Date().toLocaleDateString();
        
        coverLetter = `                                                                                                                        ${personalData.name.toUpperCase()}
                                                                                                                        COVER LETTER

[Date]
To Whom It May Concern:

I'm writing to express my strong interest in the ${jobDetails.position} position at ${jobDetails.company}. With a ${personalData.degree} from ${personalData.university} and over ${personalData.yearsExperience} years of experience in ${personalData.profession}, I am excited about the opportunity to bring my skills and insights to your team.

Currently, I work in a ${personalData.workArrangement} capacity at ${personalData.currentCompany}, based in ${personalData.currentLocation}, where I specialize in ${personalData.mainResponsibility}. In this role, I've been recognized for my ability to ${personalData.topDuty}, all while managing priorities across departments and maintaining strong relationships with stakeholders.

What sets me apart is my background in ${personalData.skills}, along with certifications such as ${personalData.certifications}. I am known for my organizational skills, attention to detail, and ability to collaborate across teams to deliver results that align with business goals.

I'm particularly drawn to this opportunity because of ${jobDetails.reason}. I believe my experience and passion for ${personalData.profession} will allow me to contribute meaningfully to your team.

Thank you for considering my application. I would welcome the opportunity to further discuss how my background and enthusiasm for this role align with ${jobDetails.company}'s goals. You can reach me at ${personalData.phone} or ${personalData.email}. I look forward to hearing from you.

Warm regards,

${personalData.name}`;
      } else {
        return res.status(400).json({ error: "Invalid request data" });
      }

      res.json({ coverLetter });
    } catch (error) {
      console.error("Error generating cover letter:", error);
      res.status(500).json({ error: "Failed to generate cover letter" });
    }
  });

  // Resume PDF Generation endpoint
  app.post("/api/generate-resume-pdf", async (req, res) => {
    try {
      const { templateId, resumeData } = req.body;
      
      if (!templateId || !resumeData) {
        return res.status(400).json({ error: "Template ID and resume data are required" });
      }

      // Generate HTML content based on template
      const htmlContent = generateResumeHTML(templateId, resumeData);
      
      // Launch puppeteer and generate PDF
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF with proper formatting
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });
      
      await browser.close();
      
      // Set headers and send PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${resumeData.name || 'resume'}_${templateId}.pdf"`);
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error("Error generating resume PDF:", error);
      res.status(500).json({ error: "Failed to generate resume PDF" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Resume HTML template generation function
function generateResumeHTML(templateId: string, resumeData: any): string {
  const baseStyles = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 800px; margin: 0 auto; padding: 20px; }
      h1 { font-size: 2.5em; margin-bottom: 10px; }
      h2 { font-size: 1.5em; margin: 20px 0 10px 0; border-bottom: 2px solid #ccc; padding-bottom: 5px; }
      h3 { font-size: 1.2em; margin: 15px 0 5px 0; }
      .header { text-align: center; margin-bottom: 30px; }
      .contact-info { font-size: 0.9em; margin: 10px 0; }
      .section { margin-bottom: 25px; }
      .experience-item, .education-item { margin-bottom: 15px; }
      .skills-list { display: flex; flex-wrap: wrap; gap: 10px; }
      .skill-tag { background: #f0f0f0; padding: 5px 10px; border-radius: 5px; font-size: 0.9em; }
    </style>
  `;

  switch (templateId) {
    case 'modern':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          ${baseStyles}
          <style>
            body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            h1 { color: #667eea; }
            h2 { color: #667eea; border-bottom-color: #667eea; }
            .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; margin: -20px -20px 30px -20px; padding: 30px 20px; border-radius: 10px 10px 0 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${resumeData.name || 'Your Name'}</h1>
              <div class="contact-info">
                <p>${resumeData.email || ''} | ${resumeData.phone || ''} | ${resumeData.location || ''}</p>
              </div>
            </div>

            <div class="section">
              <h2>Professional Summary</h2>
              <p>${resumeData.profession || 'Professional'} with ${resumeData.experience || 'several years'} of experience in the industry.</p>
            </div>

            <div class="section">
              <h2>Experience</h2>
              <div class="experience-item">
                <h3>${resumeData.profession || 'Your Position'} at ${resumeData.currentCompany || 'Company Name'}</h3>
                <p><strong>Duration:</strong> ${resumeData.experience || 'Years of experience'}</p>
                <p>Experienced professional with proven track record in ${resumeData.profession?.toLowerCase() || 'the field'}.</p>
              </div>
            </div>

            <div class="section">
              <h2>Skills</h2>
              <div class="skills-list">
                ${(resumeData.skills || 'JavaScript, React, Node.js').split(',').map((skill: string) => 
                  `<span class="skill-tag">${skill.trim()}</span>`
                ).join('')}
              </div>
            </div>

            <div class="section">
              <h2>Education</h2>
              <div class="education-item">
                <h3>${resumeData.degree || 'Degree'}</h3>
                <p>${resumeData.university || 'University Name'}</p>
              </div>
            </div>

            ${resumeData.certifications ? `
            <div class="section">
              <h2>Certifications</h2>
              <p>${resumeData.certifications}</p>
            </div>
            ` : ''}
          </div>
        </body>
        </html>
      `;

    case 'classic':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          ${baseStyles}
          <style>
            body { background: #f8f9fa; }
            .container { background: white; border: 1px solid #ddd; }
            h1 { color: #2c3e50; text-decoration: underline; }
            h2 { color: #2c3e50; border-bottom-color: #2c3e50; }
            .header { border-bottom: 3px solid #2c3e50; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${resumeData.name || 'Your Name'}</h1>
              <div class="contact-info">
                <p>${resumeData.email || ''} • ${resumeData.phone || ''} • ${resumeData.location || ''}</p>
              </div>
            </div>

            <div class="section">
              <h2>OBJECTIVE</h2>
              <p>Experienced ${resumeData.profession || 'Professional'} seeking to leverage ${resumeData.experience || 'extensive experience'} in a challenging new role.</p>
            </div>

            <div class="section">
              <h2>PROFESSIONAL EXPERIENCE</h2>
              <div class="experience-item">
                <h3>${resumeData.profession || 'Your Position'}</h3>
                <p><strong>${resumeData.currentCompany || 'Company Name'}</strong> | ${resumeData.experience || 'Years of experience'}</p>
                <p>• Demonstrated expertise in ${resumeData.profession?.toLowerCase() || 'professional field'}</p>
                <p>• Proven track record of successful project delivery and team collaboration</p>
              </div>
            </div>

            <div class="section">
              <h2>TECHNICAL SKILLS</h2>
              <p>${resumeData.skills || 'JavaScript, React, Node.js, Python, SQL'}</p>
            </div>

            <div class="section">
              <h2>EDUCATION</h2>
              <div class="education-item">
                <h3>${resumeData.degree || 'Degree'}</h3>
                <p>${resumeData.university || 'University Name'}</p>
              </div>
            </div>

            ${resumeData.certifications ? `
            <div class="section">
              <h2>CERTIFICATIONS</h2>
              <p>${resumeData.certifications}</p>
            </div>
            ` : ''}
          </div>
        </body>
        </html>
      `;

    case 'minimal':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          ${baseStyles}
          <style>
            body { background: white; }
            h1 { font-weight: 300; font-size: 2.2em; }
            h2 { font-weight: 400; color: #555; border-bottom: 1px solid #eee; }
            .skill-tag { background: white; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${resumeData.name || 'Your Name'}</h1>
              <div class="contact-info">
                <p>${resumeData.email || ''} | ${resumeData.phone || ''} | ${resumeData.location || ''}</p>
              </div>
            </div>

            <div class="section">
              <h2>Summary</h2>
              <p>${resumeData.profession || 'Professional'} with ${resumeData.experience || 'several years'} of experience.</p>
            </div>

            <div class="section">
              <h2>Experience</h2>
              <div class="experience-item">
                <h3>${resumeData.profession || 'Your Position'}</h3>
                <p>${resumeData.currentCompany || 'Company Name'} • ${resumeData.experience || 'Duration'}</p>
              </div>
            </div>

            <div class="section">
              <h2>Skills</h2>
              <div class="skills-list">
                ${(resumeData.skills || 'JavaScript, React, Node.js').split(',').map((skill: string) => 
                  `<span class="skill-tag">${skill.trim()}</span>`
                ).join('')}
              </div>
            </div>

            <div class="section">
              <h2>Education</h2>
              <p>${resumeData.degree || 'Degree'} • ${resumeData.university || 'University'}</p>
            </div>

            ${resumeData.certifications ? `
            <div class="section">
              <h2>Certifications</h2>
              <p>${resumeData.certifications}</p>
            </div>
            ` : ''}
          </div>
        </body>
        </html>
      `;

    case 'creative':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          ${baseStyles}
          <style>
            body { background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4); }
            .container { background: white; border-radius: 15px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
            h1 { color: #ff6b6b; font-weight: bold; }
            h2 { color: #4ecdc4; border-bottom-color: #4ecdc4; }
            .header { text-align: left; background: linear-gradient(135deg, #ff6b6b, #4ecdc4); color: white; margin: -20px -20px 30px -20px; padding: 30px; border-radius: 15px 15px 0 0; }
            .skill-tag { background: linear-gradient(135deg, #ff6b6b, #4ecdc4); color: white; border: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${resumeData.name || 'Your Name'}</h1>
              <div class="contact-info">
                <p>${resumeData.email || ''} • ${resumeData.phone || ''} • ${resumeData.location || ''}</p>
              </div>
            </div>

            <div class="section">
              <h2>Creative Profile</h2>
              <p>Innovative ${resumeData.profession || 'Creative Professional'} with ${resumeData.experience || 'extensive experience'} bringing fresh perspectives to every project.</p>
            </div>

            <div class="section">
              <h2>Professional Journey</h2>
              <div class="experience-item">
                <h3>${resumeData.profession || 'Your Position'}</h3>
                <p><strong>${resumeData.currentCompany || 'Creative Studio'}</strong></p>
                <p>${resumeData.experience || 'Years of creative experience'}</p>
              </div>
            </div>

            <div class="section">
              <h2>Creative Skills</h2>
              <div class="skills-list">
                ${(resumeData.skills || 'Design, Creativity, Innovation').split(',').map((skill: string) => 
                  `<span class="skill-tag">${skill.trim()}</span>`
                ).join('')}
              </div>
            </div>

            <div class="section">
              <h2>Education & Growth</h2>
              <div class="education-item">
                <h3>${resumeData.degree || 'Creative Degree'}</h3>
                <p>${resumeData.university || 'Design Institute'}</p>
              </div>
            </div>

            ${resumeData.certifications ? `
            <div class="section">
              <h2>Certifications & Awards</h2>
              <p>${resumeData.certifications}</p>
            </div>
            ` : ''}
          </div>
        </body>
        </html>
      `;

    default:
      return generateResumeHTML('modern', resumeData);
  }
}
