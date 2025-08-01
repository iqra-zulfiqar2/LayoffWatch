import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Linkedin, 
  Search, 
  Users, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Star,
  Eye,
  MessageSquare,
  Share2,
  Sparkles
} from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";

const optimizationAreas = [
  {
    id: "headline",
    title: "Professional Headline",
    description: "Craft a compelling headline that showcases your value proposition",
    score: 45,
    status: "needs-improvement"
  },
  {
    id: "summary",
    title: "About Section",
    description: "Write a persuasive summary that tells your professional story",
    score: 60,
    status: "good"
  },
  {
    id: "experience",
    title: "Experience Descriptions",
    description: "Optimize job descriptions with keywords and achievements",
    score: 30,
    status: "needs-improvement"
  },
  {
    id: "skills",
    title: "Skills & Endorsements",
    description: "Strategic skill selection and endorsement optimization",
    score: 80,
    status: "excellent"
  },
  {
    id: "recommendations",
    title: "Recommendations",
    description: "Build a portfolio of strong professional recommendations",
    score: 20,
    status: "poor"
  }
];

const keywordSuggestions = [
  "Software Engineer", "Full Stack Developer", "React", "Node.js", "TypeScript",
  "Agile", "Leadership", "Problem Solving", "Team Collaboration", "Innovation"
];

export default function LinkedInOptimizer() {
  const [activeTab, setActiveTab] = useState("analysis");
  const [profileUrl, setProfileUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentHeadline, setCurrentHeadline] = useState("");
  const [newHeadline, setNewHeadline] = useState("");
  const [profileScore, setProfileScore] = useState(47);

  const analyzeProfile = () => {
    setIsAnalyzing(true);
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-600 bg-green-100";
      case "good": return "text-blue-600 bg-blue-100";
      case "needs-improvement": return "text-yellow-600 bg-yellow-100";
      case "poor": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent": return <CheckCircle className="w-4 h-4" />;
      case "good": return <CheckCircle className="w-4 h-4" />;
      case "needs-improvement": return <AlertCircle className="w-4 h-4" />;
      case "poor": return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <GlobalHeader />

      {/* Tool Description */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Optimize Your LinkedIn Profile
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Maximize your LinkedIn visibility and professional networking success with AI-powered optimization.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Search className="w-3 h-3 mr-1" />
              SEO Enhancement
            </Badge>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
              <Users className="w-3 h-3 mr-1" />
              Network Analysis
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <TrendingUp className="w-3 h-3 mr-1" />
              Visibility Boost
            </Badge>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Analysis */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="headline">Headline</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
              </TabsList>

              {/* Profile Analysis */}
              <TabsContent value="analysis">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="text-sm font-medium">LinkedIn Profile URL</label>
                      <div className="flex space-x-2 mt-1">
                        <Input
                          placeholder="https://linkedin.com/in/yourprofile"
                          value={profileUrl}
                          onChange={(e) => setProfileUrl(e.target.value)}
                        />
                        <Button 
                          onClick={analyzeProfile}
                          disabled={isAnalyzing || !profileUrl}
                          className="bg-gradient-to-r from-blue-600 to-blue-400"
                        >
                          {isAnalyzing ? "Analyzing..." : "Analyze"}
                        </Button>
                      </div>
                    </div>

                    {/* Profile Score */}
                    <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Profile Optimization Score</h3>
                        <span className="text-2xl font-bold text-blue-600">{profileScore}%</span>
                      </div>
                      <Progress value={profileScore} className="mb-2" />
                      <p className="text-sm text-gray-600">
                        Your profile needs improvement. Focus on the areas below to increase visibility.
                      </p>
                    </div>

                    {/* Optimization Areas */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Areas for Improvement</h3>
                      {optimizationAreas.map((area) => (
                        <div key={area.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-medium">{area.title}</h4>
                                <Badge className={`${getStatusColor(area.status)} text-xs`}>
                                  {getStatusIcon(area.status)}
                                  <span className="ml-1">{area.score}%</span>
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{area.description}</p>
                            </div>
                            <Button size="sm" variant="outline">
                              Optimize
                            </Button>
                          </div>
                          <div className="mt-3">
                            <Progress value={area.score} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Headline Optimization */}
              <TabsContent value="headline">
                <Card>
                  <CardHeader>
                    <CardTitle>Headline Optimization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="text-sm font-medium">Current Headline</label>
                      <Textarea
                        placeholder="Enter your current LinkedIn headline..."
                        value={currentHeadline}
                        onChange={(e) => setCurrentHeadline(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Optimized Headlines
                    </Button>

                    <div className="space-y-4">
                      <h3 className="font-semibold">AI-Generated Headlines</h3>
                      
                      <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                        <div className="flex justify-between items-start mb-2">
                          <Badge className="bg-green-100 text-green-800">
                            <Star className="w-3 h-3 mr-1" />
                            Recommended
                          </Badge>
                          <Button size="sm" variant="outline">Use This</Button>
                        </div>
                        <p className="text-sm">
                          "Senior Software Engineer | React & Node.js Expert | Building Scalable Web Applications | Open Source Contributor"
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                          <span>⚡ SEO Score: 95%</span>
                          <span>👁️ Visibility: High</span>
                          <span>🎯 Keywords: 8</span>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="secondary">Alternative</Badge>
                          <Button size="sm" variant="outline">Use This</Button>
                        </div>
                        <p className="text-sm">
                          "Full-Stack Developer | JavaScript Specialist | Passionate About Clean Code & User Experience"
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                          <span>⚡ SEO Score: 88%</span>
                          <span>👁️ Visibility: Good</span>
                          <span>🎯 Keywords: 6</span>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="secondary">Creative</Badge>
                          <Button size="sm" variant="outline">Use This</Button>
                        </div>
                        <p className="text-sm">
                          "Transforming Ideas into Digital Reality | Senior Engineer at TechCorp | React & Cloud Architecture Expert"
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                          <span>⚡ SEO Score: 82%</span>
                          <span>👁️ Visibility: Good</span>
                          <span>🎯 Keywords: 5</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Summary Optimization */}
              <TabsContent value="summary">
                <Card>
                  <CardHeader>
                    <CardTitle>About Section Optimization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Current About Section</label>
                      <Textarea
                        placeholder="Paste your current LinkedIn About section here..."
                        rows={6}
                      />
                    </div>
                    
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Optimized About Section
                    </Button>

                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h3 className="font-semibold mb-3">Writing Tips</h3>
                      <ul className="text-sm space-y-2">
                        <li>• Start with a strong opening that captures attention</li>
                        <li>• Include relevant keywords naturally throughout</li>
                        <li>• Tell your professional story with specific achievements</li>
                        <li>• End with a clear call-to-action</li>
                        <li>• Use bullet points for easy scanning</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Keywords */}
              <TabsContent value="keywords">
                <Card>
                  <CardHeader>
                    <CardTitle>Keyword Optimization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Your Industry/Role</label>
                      <Input placeholder="e.g., Software Engineer, Marketing Manager" />
                    </div>

                    <div className="border rounded-lg p-4 bg-yellow-50">
                      <h3 className="font-semibold mb-3">Recommended Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {keywordSuggestions.map((keyword) => (
                          <Badge 
                            key={keyword}
                            variant="secondary"
                            className="cursor-pointer hover:bg-blue-100"
                          >
                            {keyword}
                            <span className="ml-2 text-xs">+</span>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Keyword Density Analysis</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">JavaScript</span>
                          <span className="text-sm text-green-600">Optimal (8%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">React</span>
                          <span className="text-sm text-yellow-600">Low (2%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Leadership</span>
                          <span className="text-sm text-red-600">Missing (0%)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Profile Views</span>
                  <span className="font-semibold">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Search Appearances</span>
                  <span className="font-semibold">567</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Connections</span>
                  <span className="font-semibold">890</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Post Engagement</span>
                  <span className="font-semibold">12.5%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Content Ideas
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Connection Targets
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Share2 className="w-4 h-4 mr-2" />
                  Engagement Strategy
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Industry Trends
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Update your profile weekly</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Post content regularly</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span>Add industry keywords</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span>Get more recommendations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}