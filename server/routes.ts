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
        
        coverLetter = `${parsedData.name || "[YOUR NAME]"}
COVER LETTER

${today}

To Whom It May Concern:

My name is ${parsedData.name || "[YOUR NAME HERE]"}. I obtained a ${parsedData.degree || "[DEGREE]"} from ${parsedData.university || "[UNIVERSITY]"}. I have been in ${parsedData.profession || "[PROFESSION]"} for ${parsedData.experience || "[X YEARS]"}. I plan to expand my knowledge in ${parsedData.profession || "[PROFESSION]"} by gaining experience in ${jobDetails.position} to support ${jobDetails.reason}. I am qualified because I have experience in ${parsedData.skills || "[HARD SKILLS + CERTIFICATION]"}. Additionally, I am certified in ${parsedData.certifications || "[OTHER CERTIFICATIONS]"}. With great enthusiasm, I apply for the ${jobDetails.position} at ${jobDetails.company}.

I currently work ${parsedData.workArrangement || "[ONSITE / HYBRID / REMOTE]"} for ${parsedData.currentCompany || "[COMPANY, LOCATION]"} with my location in ${parsedData.location || "[YOUR CITY]"}. In this position, I ${parsedData.currentRole || "[MAIN RESPONSIBILITY]"}. Managing ${parsedData.profession || "[YOUR ROLE]"} helps me organize my work to properly support ${parsedData.profession || "[WORK TYPE]"}, stakeholders, and partners. My responsibilities include ${parsedData.responsibilities || "[TOP DUTY]"}. Organization and relationship building are vital in ${parsedData.profession || "[PROFESSION]"}. I ensure efficiency and build trust with colleagues by staying organized using ${parsedData.tools || "[TOOLS OR METHODS]"}.

Based on my experience, I am a strong candidate for the ${jobDetails.position} at ${jobDetails.company}. Hiring me means gaining a dedicated professional with expertise and insight. You can reach me at ${parsedData.phone || "[PHONE NUMBER]"} or ${parsedData.email || "[EMAIL]"}. Thank you for your consideration. I look forward to your response.

Respectfully,
${parsedData.name || "[YOUR SIGNATURE]"}`;

      } else if (method === "manual" && personalData && jobDetails) {
        // Generate cover letter using manual data
        const today = new Date().toLocaleDateString();
        
        coverLetter = `${personalData.name.toUpperCase()}
COVER LETTER

${today}

To Whom It May Concern:

My name is ${personalData.name}. I obtained a ${personalData.degree} from ${personalData.university}. I have been in ${personalData.profession} for ${personalData.yearsExperience} years. I plan to expand my knowledge in ${personalData.profession} by gaining experience in ${jobDetails.position} to support ${jobDetails.reason}. I am qualified because I have experience in ${personalData.skills}. Additionally, I am certified in ${personalData.certifications}. With great enthusiasm, I apply for the ${jobDetails.position} at ${jobDetails.company}.

I currently work ${personalData.workArrangement} for ${personalData.currentCompany}, ${personalData.currentLocation} with my remote location in ${personalData.currentLocation}. In this position, I ${personalData.mainResponsibility}. Managing ${personalData.profession} helps me organize my work to properly support ${personalData.profession}, stakeholders, and partners. My responsibilities include ${personalData.topDuty}. Organization and relationship building are vital in ${personalData.profession}. I ensure efficiency and build trust with colleagues by staying organized using ${personalData.tools}.

Based on my experience, I am a strong candidate for the ${jobDetails.position} at ${jobDetails.company}. Hiring me means gaining a dedicated professional with expertise and insight. You can reach me at ${personalData.phone} or ${personalData.email}. Thank you for your consideration. I look forward to your response.

Respectfully,
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

  const httpServer = createServer(app);
  return httpServer;
}
