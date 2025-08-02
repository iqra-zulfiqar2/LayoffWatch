import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  X, 
  Shield,
  FileText,
  Mail,
  Users,
  Linkedin,
  MessageSquare,
  TrendingDown,
  ChevronDown,
  Target,
  BarChart3,
  Briefcase,
  Globe
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const tools = [
  { 
    id: "resume-builder", 
    name: "Resume Builder", 
    icon: FileText, 
    href: "/tools/resume-builder",
    description: "Create ATS-optimized resumes with AI assistance"
  },
  { 
    id: "cover-letter", 
    name: "Cover Letter Generator", 
    icon: Mail, 
    href: "/tools/cover-letter-generator",
    description: "Generate personalized cover letters instantly"
  },
  { 
    id: "interview-prep", 
    name: "Interview Preparation", 
    icon: Users, 
    href: "/tools/interview-preparation",
    description: "Practice with AI-powered mock interviews"
  },
  { 
    id: "linkedin", 
    name: "LinkedIn Optimizer", 
    icon: Linkedin, 
    href: "/tools/linkedin-optimizer",
    description: "Optimize your LinkedIn profile for maximum visibility"
  },
  { 
    id: "outreach", 
    name: "Recruiter Outreach Script Generator", 
    icon: MessageSquare, 
    href: "/tools/recruiter-outreach",
    description: "Generate personalized outreach messages for recruiters"
  },
  { 
    id: "layoff-tracker", 
    name: "Layoff Tracker", 
    icon: TrendingDown, 
    href: "/tools/layoff-tracker",
    description: "Real-time layoff tracking and job security insights"
  },
  { 
    id: "promotion-planner", 
    name: "Promotion Planner", 
    icon: Target, 
    href: "#",
    description: "Strategic planning for career advancement and promotions"
  },
  { 
    id: "job-search-optimizer", 
    name: "Job Search Optimizer", 
    icon: Globe, 
    href: "#",
    description: "Find and track the perfect job opportunities"
  },
  { 
    id: "career-path-analyzer", 
    name: "Career Path Analyzer", 
    icon: BarChart3, 
    href: "#",
    description: "Discover your ideal career trajectory"
  },
  { 
    id: "salary-negotiator", 
    name: "Salary Negotiator", 
    icon: Briefcase, 
    href: "#",
    description: "Get insights and strategies for salary negotiations"
  }
];

export default function GlobalHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-gray-900">ElevateJobs</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <div className="relative group">
              <button className="flex items-center text-white bg-purple-500 hover:bg-purple-600 font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-sm">
                AI Tools
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              
              {/* Tools Dropdown */}
              <div className="absolute top-full left-0 mt-2 w-[480px] bg-white rounded-xl shadow-2xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-3">
                    {tools.map((tool) => {
                      const IconComponent = tool.icon;
                      return (
                        <Link key={tool.id} href={tool.href}>
                          <div className="group/item flex items-start p-4 rounded-lg hover:bg-blue-50 transition-all duration-200 cursor-pointer">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mr-3 flex-shrink-0 group-hover/item:bg-blue-200 transition-colors">
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover/item:text-blue-700 transition-colors">{tool.name}</h3>
                              <p className="text-xs text-gray-600 leading-relaxed">{tool.description}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <Link href="/pricing" className="text-gray-700 hover:text-blue-600 font-medium">
              Pricing
            </Link>
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">
              About
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">
              Contact
            </a>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            ) : (
              <>
                <a href="#" className="text-gray-700 hover:text-blue-600 font-medium">
                  Sign In
                </a>
                <Link href="/magic-login">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">AI Tools</h3>
                <div className="space-y-2 pl-4">
                  {tools.map((tool) => {
                    const IconComponent = tool.icon;
                    return (
                      <Link key={tool.id} href={tool.href}>
                        <div className="flex items-center py-2 text-gray-700 hover:text-blue-600">
                          <IconComponent className="w-4 h-4 mr-2" />
                          {tool.name}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-2">
                <Link href="/pricing" className="block py-2 text-gray-700 hover:text-blue-600">
                  Pricing
                </Link>
                <a href="#" className="block py-2 text-gray-700 hover:text-blue-600">
                  About
                </a>
                <a href="#" className="block py-2 text-gray-700 hover:text-blue-600">
                  Contact
                </a>
              </div>

              <div className="pt-4 border-t space-y-2">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <a href="#" className="block py-2 text-gray-700 hover:text-blue-600">
                      Sign In
                    </a>
                    <Link href="/magic-login">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}