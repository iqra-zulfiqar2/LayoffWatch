import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginDialog } from "@/components/login-dialog";
import { 
  TrendingDown, 
  Building, 
  Users, 
  Calendar, 
  MapPin, 
  Search, 
  Filter,
  ArrowUpRight,
  AlertTriangle,
  Globe,
  Briefcase,
  ChevronRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface LayoffEvent {
  id: string;
  title: string;
  companyName: string;
  affectedEmployees: number;
  layoffDate: string;
  city?: string;
  state?: string;
  industry?: string;
  severity: string;
  sourceType: string;
}

interface Company {
  id: string;
  name: string;
  industry: string;
  status: string;
  totalLayoffs?: number;
  lastUpdate: string;
}

function Header() {
  const { user } = useAuth();
  
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-gray-900">LayoffTracker</h1>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-blue-600 font-medium">Home</a>
              <a href="/analytics" className="text-gray-600 hover:text-gray-900">Analytics</a>
              <a href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <a href="/profile" className="text-gray-600 hover:text-gray-900">Profile</a>
                <a href="/api/logout" className="text-gray-600 hover:text-gray-900">Sign Out</a>
              </>
            ) : (
              <LoginDialog>
                <Button>Sign In</Button>
              </LoginDialog>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function EnhancedHomepage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [selectedTab, setSelectedTab] = useState("recent");

  // Fetch recent layoffs data
  const { data: recentLayoffs, isLoading: layoffsLoading } = useQuery({
    queryKey: ["/api/layoffs/recent"],
    retry: false,
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Fetch companies data
  const { data: companies } = useQuery({
    queryKey: ["/api/companies"],
    retry: false,
  });

  // Mock data for charts (would come from external APIs in real implementation)
  const monthlyTrends = [
    { month: "Jan", layoffs: 15420 },
    { month: "Feb", layoffs: 18250 },
    { month: "Mar", layoffs: 22100 },
    { month: "Apr", layoffs: 19800 },
    { month: "May", layoffs: 16500 },
    { month: "Jun", layoffs: 14200 },
  ];

  const industryData = [
    { name: "Technology", value: 45, employees: 89450 },
    { name: "Finance", value: 20, employees: 42300 },
    { name: "Retail", value: 15, employees: 28900 },
    { name: "Healthcare", value: 12, employees: 18600 },
    { name: "Other", value: 8, employees: 15750 },
  ];

  const colors = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6'];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getSourceBadge = (sourceType: string) => {
    switch (sourceType) {
      case 'layoffs_fyi': return <Badge variant="outline" className="text-blue-600">layoffs.fyi</Badge>;
      case 'warntracker': return <Badge variant="outline" className="text-green-600">WARN</Badge>;
      case 'layoffdata': return <Badge variant="outline" className="text-purple-600">LayoffData</Badge>;
      default: return <Badge variant="outline">Manual</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Stats Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              LayoffTracker
            </h1>
            <p className="text-xl text-blue-100 mb-6 max-w-3xl mx-auto">
              Comprehensive tracking of layoffs from major sources including layoffs.fyi, WARN Act data, and government reports. 
              Stay informed with real-time updates across all industries.
            </p>
          </div>

          {/* Key Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">185K+</div>
              <div className="text-blue-100">Total Employees Affected</div>
              <div className="text-sm text-blue-200">Since 2020</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">2,813</div>
              <div className="text-blue-100">Companies Tracked</div>
              <div className="text-sm text-blue-200">Tech & Beyond</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">78K+</div>
              <div className="text-blue-100">WARN Notices</div>
              <div className="text-sm text-blue-200">Government Data</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">Live</div>
              <div className="text-blue-100">Real-time Updates</div>
              <div className="text-sm text-blue-200">Multiple Sources</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search companies, industries, or states..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterIndustry} onValueChange={setFilterIndustry}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterState} onValueChange={setFilterState}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="WA">Washington</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="recent">Recent Layoffs</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="map">Geographic</TabsTrigger>
          </TabsList>

          {/* Recent Layoffs Tab */}
          <TabsContent value="recent" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Layoff Events List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-red-500" />
                      Latest Layoff Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {layoffsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                      ) : (
                        Array.isArray(recentLayoffs) ? recentLayoffs.slice(0, 10).map((layoff: LayoffEvent) => (
                          <div key={layoff.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{layoff.companyName}</h3>
                                <p className="text-gray-600">{layoff.title}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-red-600">
                                  {layoff.affectedEmployees?.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500">employees</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(layoff.layoffDate)}
                              </div>
                              {layoff.city && layoff.state && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {layoff.city}, {layoff.state}
                                </div>
                              )}
                              <Badge className={getSeverityColor(layoff.severity)}>
                                {layoff.severity}
                              </Badge>
                              {getSourceBadge(layoff.sourceType)}
                            </div>
                          </div>
                        )) : []
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Industry Breakdown */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Industry Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={industryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {industryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-4">
                      {industryData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium">{item.employees.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Companies with Layoffs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.isArray(companies) ? companies.slice(0, 12).map((company: Company) => (
                    <div key={company.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{company.name}</h3>
                        <Badge variant={company.status === 'active_layoffs' ? 'destructive' : 'secondary'}>
                          {company.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{company.industry}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Updated {formatDate(company.lastUpdate)}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  )) : []}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Layoff Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Layoffs']} />
                      <Line type="monotone" dataKey="layoffs" stroke="#3B82F6" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Industry Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={industryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Employees']} />
                      <Bar dataKey="employees" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Geographic Tab */}
          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Layoffs by State
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Interactive Map Coming Soon</h3>
                  <p className="text-gray-600">
                    Visualize layoff data across states with our interactive map feature.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Ahead of Industry Changes</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Get real-time notifications, track multiple companies, and access detailed analytics 
            to make informed career decisions.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" variant="secondary">
              <a href="/pricing">View Pricing Plans</a>
            </Button>
            <LoginDialog>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
                Get Started Free
              </Button>
            </LoginDialog>
          </div>
        </div>
      </div>
    </div>
  );
}