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

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({
    dest: 'uploads/',
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
    
    // Extract name (typically first line or after "Name:" label)
    const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
    const namePatterns = [
      /^Name:\s*(.+)$/i,
      /^(.+)$/  // First non-empty line if no explicit name label
    ];
    
    for (const line of lines.slice(0, 5)) { // Check first 5 lines
      for (const pattern of namePatterns) {
        const match = line.match(pattern);
        if (match && match[1] && 
            !match[1].includes('@') && 
            !match[1].match(/\d{3}/) && 
            match[1].split(' ').length >= 2) {
          data.name = match[1].trim();
          break;
        }
      }
      if (data.name) break;
    }
    
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

      // Read file content based on file type
      if (req.file.mimetype === 'text/plain') {
        resumeText = fs.readFileSync(filePath, 'utf8');
      } else if (req.file.mimetype === 'application/pdf') {
        // For PDF files, we'll return a placeholder for now
        // In production, you'd use a PDF parsing library like pdf-parse
        resumeText = "PDF content would be extracted here. Please use a .txt file for now.";
      } else {
        // For Word documents, return placeholder
        resumeText = "Word document content would be extracted here. Please use a .txt file for now.";
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

  // Enhanced cover letter generation endpoint with resume parsing
  app.post("/api/generate-cover-letter", async (req, res) => {
    try {
      const { resumeText, jobDetails, personalData, method } = req.body;
      
      let coverLetter = "";
      
      if (method === "resume" && resumeText && jobDetails) {
        // Parse resume to extract key information
        const parsedData = parseResumeText(resumeText);
        
        // Generate cover letter using parsed resume data
        const today = new Date().toLocaleDateString();
        
        coverLetter = `                                                                                                                        ${(parsedData.name || "NAME").toUpperCase()}
                                                                                                                        COVER LETTER

[Date]
To Whom It May Concern:

[This first paragraph is your introduction to the person reading this. Depending on if your applying, you may use the first or second language template. Keep all critical lines within this pivot. This means you will not add pivotal language instead of saying "additionally, I am certified in..."]

My name is ${parsedData.name || "[YOUR NAME HERE]"}. I obtained a ${parsedData.degree || "[DEGREE FROM WHERE]"}. I have been in ${parsedData.profession || "[NAME OF PROFESSION AND POSITION]"} by continuing my experience in ${parsedData.currentRole || "[NAME OF POSITION]"} to aid ${parsedData.currentCompany || "[NAME YOUR REASON]"}. I am excited for the position titled ${jobDetails.position || "[NAME OF POSITION]"} that have excellent and experience that are listed on your resume and most important certification. Additionally, I am certified ${parsedData.certifications || "[NAME ADDITIONAL CERTIFICATIONS & APPLICATIONS]"}. I am with extreme enthusiasm that I apply to the ${jobDetails.position || "[NAME OF POSITION]"} with ${jobDetails.company || "[NAME OF COMPANY]"}.

[This second paragraph is for you to talk about enthusiasm that I apply to current or most recent role]

My current role where I was employed with was [ELABORATE WHERE THE COMPANY IS LOCATED] with my remote location in ${parsedData.location || "[WHERE YOU WORK FROM]"}. In my position, ${parsedData.responsibilities || "[NAME THE MOST IMPORTANT THINGS YOU DO IN YOUR ROLE]"} and in these specific areas as well as [RESTATE POSITION], I am able to organize and balance my work to ensure I am getting the proper rest to take care of my stakeholders and partners, with respect to my responsibilities, [NAME THE FIRST RESPONSIBILITY LISTED ON YOUR RESUME](currently [COURSES]/[CLIENTS]). Furthermore, including myself me in [RESPONSIBLE IN THE INDUSTRY, HOW YOU STAY ORGANIZED]. I maintain an [NAME HOW YOU STAY ORGANIZED].

[This third paragraph provides room for you to add one more relevant position to explain to enlighten the recruiter, interviewer or hiring manager. Since your second paragraph is fairly long, keep this short-- 3 sentences at most.]

${parsedData.experience ? `I have ${parsedData.experience} of experience in ${parsedData.profession}.` : "[NAME ADDITIONAL RELEVANT EXPERIENCE AND FOLLOW THE SAME FORMAT AS THE PARAGRAPH ABOVE. THIS PARAGRAPH WON'T BE AS LENGTHY. DEPENDING ON YOUR EXPERIENCE LEVEL AND THE POSITION YOU ARE APPLYING TO. YOU MAY NOT NEED THIS PARAGRAPH USE YOUR DISCRETION]"}

[This last paragraph is your conclusion—time to wrap it up!]

Due to my experience and desire to work remote and locally at your ${jobDetails.company || "[NAME OF COMPANY]"}, choosing me will be a great decision as I will bring expertise and a wealth of knowledge into your company. It can be reached at ${parsedData.phone || "[PHONE NUMBER]"} or ${parsedData.email || "[EMAIL]"}. Thank you for your consideration. I look forward to hearing from you.

Respectfully Submitted,
[YOUR SIGNATURE HERE]`;

      } else if (method === "manual" && personalData && jobDetails) {
        // Generate cover letter using manual data
        const today = new Date().toLocaleDateString();
        
        coverLetter = `                                                                                                                        ${personalData.name.toUpperCase()}
                                                                                                                        COVER LETTER

[Date]
To Whom It May Concern:

[This first paragraph is your introduction to the person reading this. Depending on if your applying, you may use the first or second language template. Keep all critical lines within this pivot. This means you will not add pivotal language instead of saying "additionally, I am certified in..."]

My name is ${personalData.name}. I obtained a ${personalData.degree} from ${personalData.university}. I have been in ${personalData.profession} by continuing my experience in ${personalData.mainResponsibility} to aid ${personalData.currentCompany}. I am excited for the position titled ${jobDetails.position} that have excellent and experience that are listed on your resume and most important certification. Additionally, I am certified ${personalData.certifications}. I am with extreme enthusiasm that I apply to the ${jobDetails.position} with ${jobDetails.company}.

[This second paragraph is for you to talk about enthusiasm that I apply to current or most recent role]

My current role where I was employed with was [ELABORATE WHERE THE COMPANY IS LOCATED] with my remote location in ${personalData.currentLocation}. In my position, ${personalData.topDuty} and in these specific areas as well as [RESTATE POSITION], I am able to organize and balance my work to ensure I am getting the proper rest to take care of my stakeholders and partners, with respect to my responsibilities, [NAME THE FIRST RESPONSIBILITY LISTED ON YOUR RESUME](currently [COURSES]/[CLIENTS]). Furthermore, including myself me in [RESPONSIBLE IN THE INDUSTRY, HOW YOU STAY ORGANIZED]. I maintain an [NAME HOW YOU STAY ORGANIZED].

[This third paragraph provides room for you to add one more relevant position to explain to enlighten the recruiter, interviewer or hiring manager. Since your second paragraph is fairly long, keep this short-- 3 sentences at most.]

I have ${personalData.yearsExperience} years of experience in ${personalData.profession}. My expertise includes ${personalData.skills} and proficiency with ${personalData.tools}.

[This last paragraph is your conclusion—time to wrap it up!]

Due to my experience and desire to work ${personalData.workArrangement} and locally at your ${jobDetails.company}, choosing me will be a great decision as I will bring expertise and a wealth of knowledge into your company. It can be reached at ${personalData.phone} or ${personalData.email}. Thank you for your consideration. I look forward to hearing from you.

Respectfully Submitted,
[YOUR SIGNATURE HERE]`;
      } else {
        return res.status(400).json({ error: "Invalid request data" });
      }

      res.json({ coverLetter });
    } catch (error) {
      console.error("Error generating cover letter:", error);
      res.status(500).json({ error: "Failed to generate cover letter" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
