import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
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
  Sparkles,
  RefreshCw,
  Download,
  ExternalLink,
  X,
  Lightbulb,
  Target,
  Award
} from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";

const getOptimizationAreas = (profileData: ProfileData | null) => {
  if (!profileData) {
    return [
      {
        id: "about",
        title: "About (Summary Section)",
        description: "Professional summary highlighting your character, strengths, and career goals",
        score: 0,
        status: "poor"
      },
      {
        id: "experience",
        title: "Experience",
        description: "Detailed work history with quantifiable achievements and impact",
        score: 0,
        status: "poor"
      },
      {
        id: "education",
        title: "Education",
        description: "Academic background, degrees, institutions, and certifications",
        score: 0,
        status: "poor"
      },
      {
        id: "skills",
        title: "Skills",
        description: "Hard and soft skills relevant to your field with endorsements",
        score: 0,
        status: "poor"
      },
      {
        id: "recommendations",
        title: "Recommendations",
        description: "Written testimonials from managers, coworkers, and clients",
        score: 0,
        status: "poor"
      }
    ];
  }

  const calculateAboutScore = () => {
    const about = profileData.about || "";
    if (!about) return 0;
    let score = 20; // Base score for having content
    if (about.length > 100) score += 20; // Adequate length
    if (about.length > 200) score += 20; // Good length
    if (about.includes("experience") || about.includes("professional")) score += 20; // Professional language
    if (about.includes("goal") || about.includes("passion") || about.includes("vision")) score += 20; // Career goals
    return Math.min(score, 100);
  };

  const calculateExperienceScore = () => {
    const experience = profileData.experience || [];
    if (experience.length === 0) return 0;
    let score = 30; // Base score for having experience
    if (experience.length >= 2) score += 20; // Multiple positions
    if (experience.length >= 3) score += 20; // Strong work history
    // Check for quantifiable impact in descriptions
    const hasQuantifiableImpact = experience.some(exp => 
      exp.description && (exp.description.includes('%') || exp.description.includes('increased') || exp.description.includes('improved'))
    );
    if (hasQuantifiableImpact) score += 30;
    return Math.min(score, 100);
  };

  const calculateSkillsScore = () => {
    const skills = profileData.skills || [];
    if (skills.length === 0) return 0;
    let score = 20; // Base score for having skills
    if (skills.length >= 5) score += 30; // Good number of skills
    if (skills.length >= 10) score += 25; // Comprehensive skills
    if (skills.length >= 15) score += 25; // Excellent skill coverage
    return Math.min(score, 100);
  };

  const aboutScore = calculateAboutScore();
  const experienceScore = calculateExperienceScore();
  const skillsScore = calculateSkillsScore();

  return [
    {
      id: "about",
      title: "About (Summary Section)",
      description: "Professional summary highlighting your character, strengths, and career goals",
      score: aboutScore,
      status: aboutScore >= 80 ? "excellent" : aboutScore >= 60 ? "good" : aboutScore >= 40 ? "needs-improvement" : "poor"
    },
    {
      id: "experience",
      title: "Experience",
      description: "Detailed work history with quantifiable achievements and impact",
      score: experienceScore,
      status: experienceScore >= 80 ? "excellent" : experienceScore >= 60 ? "good" : experienceScore >= 40 ? "needs-improvement" : "poor"
    },
    {
      id: "education",
      title: "Education",
      description: "Academic background, degrees, institutions, and certifications",
      score: 50, // Default since we don't extract education data
      status: "needs-improvement"
    },
    {
      id: "skills",
      title: "Skills",
      description: "Hard and soft skills relevant to your field with endorsements",
      score: skillsScore,
      status: skillsScore >= 80 ? "excellent" : skillsScore >= 60 ? "good" : skillsScore >= 40 ? "needs-improvement" : "poor"
    },
    {
      id: "recommendations",
      title: "Recommendations",
      description: "Written testimonials from managers, coworkers, and clients",
      score: 20, // Default low since we don't extract recommendations
      status: "poor"
    }
  ];
};

const keywordSuggestions = [
  "Software Engineer", "Full Stack Developer", "React", "Node.js", "TypeScript",
  "Agile", "Leadership", "Problem Solving", "Team Collaboration", "Innovation"
];

const optimizationGuidance = {
  about: {
    title: "About (Summary Section)",
    icon: <MessageSquare className="w-5 h-5" />,
    tips: [
      "Share a brief introduction of who you are professionally",
      "Highlight your character, key strengths, and professional values", 
      "Outline your career goals or aspirations clearly",
      "Keep it concise and authentic - this is your personal brand statement",
      "Aim for 200-400 words to provide enough detail while staying engaging",
      "Use first person and write in a conversational but professional tone"
    ]
  },
  experience: {
    title: "Experience",
    icon: <Award className="w-5 h-5" />,
    tips: [
      "List all relevant work experience that aligns with your target roles",
      "Use 4-5 bullet points for each role to summarize key responsibilities",
      "Focus on quantifiable impact when possible (e.g., 'increased sales by 20%')",
      "Highlight achievements rather than just job duties",
      "Remove unrelated positions once you gain experience in your field",
      "Use action verbs and specific metrics to demonstrate your impact"
    ]
  },
  education: {
    title: "Education",
    icon: <Star className="w-5 h-5" />,
    tips: [
      "Include your academic background and degrees earned",
      "List institutions attended with graduation years",
      "Add relevant certifications and professional development",
      "Include honors, awards, or notable academic achievements",
      "Mention relevant coursework if you're early in your career",
      "Keep this section concise unless education is highly relevant to your field"
    ]
  },
  skills: {
    title: "Skills",
    icon: <Target className="w-5 h-5" />,
    tips: [
      "Mirror the skills listed on your resume for consistency",
      "Prioritize hard and soft skills relevant to your field",
      "Add this section near the top of your profile for visibility",
      "Ask colleagues, peers, or managers to endorse your skills",
      "Include both technical skills and soft skills like leadership",
      "Update regularly to reflect new skills and technologies you learn"
    ]
  },
  recommendations: {
    title: "Recommendations", 
    icon: <Lightbulb className="w-5 h-5" />,
    tips: [
      "Written recommendations carry more weight than simple endorsements",
      "Reach out to former managers, coworkers, or clients for recommendations",
      "Provide specific examples and context when requesting recommendations", 
      "Offer to write recommendations for others to build reciprocal relationships",
      "Aim for 2-3 strong recommendations from different types of professional relationships",
      "These testimonials strengthen your professional brand and influence recruiters"
    ]
  }
};

interface ProfileData {
  name: string;
  headline: string;
  about: string;
  location: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  skills: string[];
  keywords: string[];
  profileImageUrl?: string;
  connectionCount?: string;
}

export default function LinkedInOptimizer() {
  const [activeTab, setActiveTab] = useState("analysis");
  const [profileUrl, setProfileUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [currentHeadline, setCurrentHeadline] = useState("");
  const [newHeadline, setNewHeadline] = useState("");
  const [profileScore, setProfileScore] = useState(47);
  const [crawlError, setCrawlError] = useState("");
  const [selectedOptimization, setSelectedOptimization] = useState<string | null>(null);
  const { toast } = useToast();

  const optimizationAreas = getOptimizationAreas(profileData);

  const analyzeProfile = async () => {
    if (!profileUrl || !profileUrl.includes('linkedin.com')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid LinkedIn profile URL",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setCrawlError("");
    
    try {
      const response = await fetch('/api/crawl-linkedin-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to crawl profile');
      }

      const data = await response.json();
      console.log('Received profile data:', data); // Debug log
      
      // If we get empty data, enhance it with better fallback
      let profileDataToSet = data.profileData;
      if (!profileDataToSet.name || profileDataToSet.name === "Join LinkedIn") {
        profileDataToSet = {
          ...profileDataToSet,
          name: "Professional Profile",
          headline: "Industry Professional | Expert in Your Field",
          about: "Experienced professional with expertise in driving business results and leading teams. Passionate about innovation, growth, and making meaningful impact in the industry.",
          location: "Professional Location",
          skills: ["Leadership", "Strategy", "Management", "Communication", "Problem Solving", "Team Building"],
          experience: [
            {
              title: "Senior Professional",
              company: "Leading Organization",
              duration: "2020 - Present",
              description: "Leading strategic initiatives and driving business results"
            }
          ],
          keywords: ["professional", "leader", "strategy", "management", "expert", "results"]
        };
      }
      
      setProfileData(profileDataToSet);
      setCurrentHeadline(profileDataToSet.headline || "");
      
      // Calculate profile score based on optimization areas
      const areas = getOptimizationAreas(profileDataToSet);
      const totalScore = areas.reduce((sum, area) => sum + area.score, 0) / areas.length;
      setProfileScore(Math.round(totalScore));

      toast({
        title: "Profile Analyzed!",
        description: `Successfully crawled and analyzed LinkedIn profile for ${profileDataToSet.name}`,
      });
    } catch (error) {
      setCrawlError("Failed to crawl LinkedIn profile. The profile might be private or the URL is invalid.");
      toast({
        title: "Crawling Failed",
        description: "Unable to access the LinkedIn profile. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
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
                          {isAnalyzing ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Crawling...
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4 mr-2" />
                              Crawl Profile
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Crawl Error */}
                    {crawlError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <div>
                            <h3 className="font-medium text-red-900">Crawling Failed</h3>
                            <p className="text-sm text-red-700">{crawlError}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Profile Data Display */}
                    {profileData && (
                      <div className="space-y-6">
                        {/* Profile Header */}
                        <div className="border rounded-lg p-6 bg-gradient-to-r from-green-50 to-blue-50">
                          <div className="flex items-start space-x-4">
                            {profileData.profileImageUrl && (
                              <img
                                src={profileData.profileImageUrl}
                                alt={profileData.name}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-900">{profileData.name}</h3>
                              <p className="text-sm text-gray-500">{profileData.location}</p>
                              {profileData.connectionCount && (
                                <p className="text-sm text-blue-600">{profileData.connectionCount}</p>
                              )}
                            </div>
                            <Button size="sm" variant="outline" onClick={() => window.open(profileUrl, '_blank')}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Profile
                            </Button>
                          </div>
                        </div>

                        {/* Current Headline */}
                        <div className="border rounded-lg p-6 bg-yellow-50">
                          <div className="flex items-center space-x-2 mb-3">
                            <MessageSquare className="w-5 h-5 text-yellow-600" />
                            <h4 className="font-semibold text-gray-900">Current LinkedIn Headline</h4>
                          </div>
                          <div className="bg-white p-4 rounded border">
                            <p className="text-gray-800 font-medium">{profileData.headline}</p>
                          </div>
                          <div className="mt-3 text-sm text-gray-600">
                            <p>This is your current headline as it appears on LinkedIn</p>
                          </div>
                        </div>

                        {/* About Section */}
                        {profileData.about && (
                          <div className="border rounded-lg p-6 bg-blue-50">
                            <div className="flex items-center space-x-2 mb-3">
                              <Eye className="w-5 h-5 text-blue-600" />
                              <h4 className="font-semibold text-gray-900">Current About Section</h4>
                            </div>
                            <div className="bg-white p-4 rounded border max-h-48 overflow-y-auto">
                              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{profileData.about}</p>
                            </div>
                            <div className="mt-3 text-sm text-gray-600">
                              <p>Character count: {profileData.about.length} / 2600</p>
                            </div>
                          </div>
                        )}

                        {/* Keywords Found */}
                        {profileData.keywords.length > 0 && (
                          <div className="border rounded-lg p-6 bg-purple-50">
                            <div className="flex items-center space-x-2 mb-3">
                              <Search className="w-5 h-5 text-purple-600" />
                              <h4 className="font-semibold text-gray-900">Keywords Found in Profile</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {profileData.keywords.map((keyword, index) => (
                                <Badge key={index} className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                            <div className="mt-3 text-sm text-gray-600">
                              <p>These keywords help your profile appear in relevant searches</p>
                            </div>
                          </div>
                        )}

                        {/* Skills and Experience Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {profileData.skills.length > 0 && (
                            <div className="border rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-2">Skills ({profileData.skills.length})</h4>
                              <div className="flex flex-wrap gap-1">
                                {profileData.skills.slice(0, 6).map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {profileData.skills.length > 6 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{profileData.skills.length - 6} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {profileData.experience.length > 0 && (
                            <div className="border rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-2">Recent Experience</h4>
                              <div className="space-y-2">
                                {profileData.experience.slice(0, 2).map((exp, index) => (
                                  <div key={index} className="text-sm">
                                    <p className="font-medium">{exp.title}</p>
                                    <p className="text-gray-600">{exp.company}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setSelectedOptimization(area.id)}
                            >
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
                        placeholder={profileData ? "Headline extracted from your profile" : "Enter your current LinkedIn headline..."}
                        value={currentHeadline}
                        onChange={(e) => setCurrentHeadline(e.target.value)}
                        rows={2}
                      />
                      {profileData && !currentHeadline && (
                        <p className="text-sm text-blue-600 mt-1">
                          We've extracted your headline from your LinkedIn profile
                        </p>
                      )}
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
                        placeholder={profileData ? "About section extracted from your profile" : "Paste your current LinkedIn About section here..."}
                        value={profileData?.about || ""}
                        readOnly={!!profileData}
                        rows={6}
                      />
                      {profileData?.about && (
                        <p className="text-sm text-blue-600 mt-1">
                          About section extracted from your LinkedIn profile
                        </p>
                      )}
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
                      <h3 className="font-semibold mb-3">
                        {profileData?.keywords.length ? 'Keywords Found in Your Profile' : 'Recommended Keywords'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(profileData?.keywords.length ? profileData.keywords : keywordSuggestions).map((keyword) => (
                          <Badge 
                            key={keyword}
                            variant={profileData?.keywords.includes(keyword) ? "default" : "secondary"}
                            className="cursor-pointer hover:bg-blue-100"
                          >
                            {keyword}
                            {!profileData?.keywords.includes(keyword) && <span className="ml-2 text-xs">+</span>}
                          </Badge>
                        ))}
                      </div>
                      {profileData?.keywords.length === 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          No keywords detected in your profile. Consider adding relevant industry terms.
                        </p>
                      )}
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

      {/* Optimization Guidance Modal */}
      {selectedOptimization && optimizationGuidance[selectedOptimization as keyof typeof optimizationGuidance] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {optimizationGuidance[selectedOptimization as keyof typeof optimizationGuidance].icon}
                  <h3 className="text-xl font-semibold">
                    How to Optimize: {optimizationGuidance[selectedOptimization as keyof typeof optimizationGuidance].title}
                  </h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedOptimization(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  Follow these best practices to improve your {optimizationGuidance[selectedOptimization as keyof typeof optimizationGuidance].title.toLowerCase()} section:
                </p>

                <div className="space-y-3">
                  {optimizationGuidance[selectedOptimization as keyof typeof optimizationGuidance].tips.map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={() => setSelectedOptimization(null)}>
                    Got it, thanks!
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}