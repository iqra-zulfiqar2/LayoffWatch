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
  TrendingDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const tools = [
  { id: "layoff-tracker", name: "Layoff Tracker", icon: TrendingDown, href: "/tools/layoff-tracker" },
  { id: "resume-builder", name: "Resume Builder", icon: FileText, href: "/tools/resume-builder" },
  { id: "cover-letter", name: "Cover Letter", icon: Mail, href: "/tools/cover-letter-generator" },
  { id: "interview-prep", name: "Interview Prep", icon: Users, href: "/tools/interview-preparation" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, href: "/tools/linkedin-optimizer" },
  { id: "outreach", name: "Outreach", icon: MessageSquare, href: "/tools/recruiter-outreach" }
];

export default function GlobalHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LayOff Proof
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Career Protection Suite</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {tools.map((tool) => {
              const IconComponent = tool.icon;
              const isActive = location.startsWith(tool.href);
              return (
                <Link key={tool.id} href={tool.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`flex items-center space-x-2 ${
                      isActive 
                        ? "bg-blue-50 text-blue-700 border border-blue-200" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="hidden xl:inline">{tool.name}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            <Link href="/pricing" className="hidden sm:block">
              <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50">
                Pricing
              </Button>
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    Profile
                  </Button>
                </Link>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </div>
              </div>
            ) : (
              <>
                <Link href="/magic-login">
                  <Button variant="outline" size="sm" className="hidden sm:inline-flex border-gray-200 hover:bg-gray-50">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4">
            <div className="flex flex-col space-y-2">
              {tools.map((tool) => {
                const IconComponent = tool.icon;
                const isActive = location.startsWith(tool.href);
                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start ${
                        isActive 
                          ? "bg-blue-50 text-blue-700" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <IconComponent className="w-4 h-4 mr-3" />
                      {tool.name}
                    </Button>
                  </Link>
                );
              })}
              <div className="border-t border-gray-100 pt-2 mt-2">
                <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-gray-600">
                    Pricing
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <>
                    <Link href="/magic-login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-gray-600">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full mt-2 bg-gradient-to-r from-blue-500 to-purple-600">
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