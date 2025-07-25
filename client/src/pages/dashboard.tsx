import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import CompanySearch from "@/components/CompanySearch";
import CompanyDashboard from "@/components/CompanyDashboard";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Building, TriangleAlert, Clock, TrendingUp, Users, AlertTriangle, Calendar, MapPin, Briefcase } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Dashboard stats query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Recent layoffs query
  const { data: recentLayoffs, isLoading: layoffsLoading } = useQuery({
    queryKey: ["/api/layoffs/recent"],
    retry: false,
  });

  // Companies query
  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ["/api/companies"],
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white">
            <h2 className="text-4xl font-bold mb-2">
              Welcome back, {user?.firstName || 'User'}! 👋
            </h2>
            <p className="text-blue-100 text-lg">
              Stay informed about layoff activities at your company and across the industry. Track {stats?.total || 0} companies and monitor real-time layoff events.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Companies Tracked</p>
                  <p className="text-3xl font-bold text-green-800">{stats?.total || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">Active Layoffs</p>
                  <p className="text-3xl font-bold text-red-800">{recentLayoffs?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <TriangleAlert className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Total Affected</p>
                  <p className="text-3xl font-bold text-blue-800">
                    {recentLayoffs?.reduce((sum: number, event: any) => sum + (event.affectedEmployees || 0), 0).toLocaleString() || '0'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">This Month</p>
                  <p className="text-3xl font-bold text-purple-800">
                    {recentLayoffs?.filter((event: any) => {
                      const eventDate = new Date(event.eventDate);
                      const now = new Date();
                      return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
                    }).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Layoffs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                Recent Layoff Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {layoffsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentLayoffs?.slice(0, 6).map((event: any, index: number) => (
                    <div key={index} className="border-l-4 border-red-400 pl-4 py-2 bg-red-50 rounded-r-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 mb-1">{event.title}</h4>
                          <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {event.affectedEmployees?.toLocaleString()} affected
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(event.eventDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Badge 
                          variant={event.severity === 'high' ? 'destructive' : event.severity === 'medium' ? 'secondary' : 'default'}
                          className="ml-2"
                        >
                          {event.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <Link href="/analytics">
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View All Analytics
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl">
                <Building className="w-5 h-5 mr-2 text-blue-500" />
                Companies by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {companiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {companies?.slice(0, 8).map((company: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{company.name}</h4>
                          <div className="flex items-center text-sm text-slate-600">
                            <MapPin className="w-3 h-3 mr-1" />
                            {company.headquarters}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            company.status === 'active_layoffs' ? 'destructive' : 
                            company.status === 'monitoring' ? 'secondary' : 'default'
                          }
                          className="mb-1"
                        >
                          {company.status?.replace('_', ' ')}
                        </Badge>
                        <p className="text-xs text-slate-500">{company.industry}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <Link href="/profile">
                  <Button variant="outline" className="w-full">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Manage Tracking
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Search and Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Search Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <CompanySearch />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <CompanyDashboard />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
        <div className="grid grid-cols-3 py-2">
          <Link href="/" className="flex flex-col items-center py-2 text-primary">
            <div className="w-6 h-6 mb-1">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link href="/analytics" className="flex flex-col items-center py-2 text-slate-400">
            <div className="w-6 h-6 mb-1">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
            </div>
            <span className="text-xs">Analytics</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center py-2 text-slate-400">
            <div className="w-6 h-6 mb-1">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}