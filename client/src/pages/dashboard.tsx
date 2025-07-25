import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import CompanySearch from "@/components/CompanySearch";
import CompanyDashboard from "@/components/CompanyDashboard";
import Sidebar from "@/components/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Building, TriangleAlert, Clock } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Dashboard stats query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user.firstName || 'User'}
          </h2>
          <p className="text-slate-600">
            Stay informed about layoff activities at your company and across the industry.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-success" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Your Company Status</p>
                  <p className="text-2xl font-bold text-success">Safe</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Companies Tracked</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {statsLoading ? "..." : stats?.total || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                    <TriangleAlert className="w-4 h-4 text-warning" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Recent Layoffs</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {statsLoading ? "..." : stats?.recentLayoffs || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Last Updated</p>
                  <p className="text-2xl font-bold text-slate-900">2h ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <CompanySearch />
            <CompanyDashboard />
          </div>

          {/* Sidebar */}
          <div>
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
        <div className="grid grid-cols-4 py-2">
          <button className="flex flex-col items-center py-2 text-primary">
            <div className="w-6 h-6 mb-1">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            <span className="text-xs">Dashboard</span>
          </button>
          <button className="flex flex-col items-center py-2 text-slate-400">
            <Building className="w-6 h-6 mb-1" />
            <span className="text-xs">Companies</span>
          </button>
          <button className="flex flex-col items-center py-2 text-slate-400">
            <div className="w-6 h-6 mb-1">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
            </div>
            <span className="text-xs">Analytics</span>
          </button>
          <button className="flex flex-col items-center py-2 text-slate-400">
            <div className="w-6 h-6 mb-1">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
