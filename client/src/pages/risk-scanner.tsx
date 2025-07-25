import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, TrendingDown, TrendingUp, Lightbulb, Target, Users, DollarSign } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RiskAnalysis {
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number;
  summary: string;
  companyHealth: {
    score: number;
    factors: string[];
  };
  jobTitleRisk: {
    score: number;
    trends: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  skillGaps: string[];
  marketOutlook: string;
}

const jobTitles = [
  "Software Engineer",
  "Product Manager",
  "Data Scientist", 
  "Marketing Manager",
  "Sales Representative",
  "Customer Success Manager",
  "Human Resources",
  "Operations Manager",
  "Business Analyst",
  "UX/UI Designer",
  "DevOps Engineer",
  "Quality Assurance",
  "Content Marketing",
  "Financial Analyst",
  "Project Manager",
  "Customer Support",
  "Administrative Assistant",
  "Recruiter",
  "Account Manager",
  "Research Scientist"
];

export default function RiskScanner() {
  const [formData, setFormData] = useState({
    jobTitle: "",
    companyName: "",
    yearsExperience: "",
    currentSkills: "",
    industry: ""
  });

  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const { toast } = useToast();

  const analyzeRiskMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/risk-analysis", data);
      if (!response.ok) {
        throw new Error("Failed to analyze risk");
      }
      return response.json();
    },
    onSuccess: (result: RiskAnalysis) => {
      setAnalysis(result);
      toast({
        title: "Analysis Complete",
        description: "Your job security risk analysis is ready",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jobTitle || !formData.companyName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    analyzeRiskMutation.mutate(formData);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "text-green-600 bg-green-50 border-green-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "low": return <Shield className="h-5 w-5" />;
      case "medium": return <TrendingUp className="h-5 w-5" />;
      case "high": return <AlertTriangle className="h-5 w-5" />;
      case "critical": return <TrendingDown className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Job Security Risk Scanner
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get personalized insights about your job security and actionable recommendations to protect your career
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Risk Analysis Form
            </CardTitle>
            <CardDescription>
              Provide your job details for a comprehensive security analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Select value={formData.jobTitle} onValueChange={(value) => setFormData({...formData, jobTitle: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your job title" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTitles.map((title) => (
                        <SelectItem key={title} value={title}>
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    placeholder="Enter your company name"
                  />
                </div>

                <div>
                  <Label htmlFor="yearsExperience">Years of Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})}
                    placeholder="e.g., 3"
                  />
                </div>

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    placeholder="e.g., Technology, Finance, Healthcare"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currentSkills">Current Skills & Technologies</Label>
                <Textarea
                  id="currentSkills"
                  value={formData.currentSkills}
                  onChange={(e) => setFormData({...formData, currentSkills: e.target.value})}
                  placeholder="List your key skills, technologies, and certifications..."
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={analyzeRiskMutation.isPending}
              >
                {analyzeRiskMutation.isPending ? "Analyzing..." : "Analyze Job Security Risk"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {analysis && (
          <div className="space-y-6">
            {/* Risk Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getRiskIcon(analysis.riskLevel)}
                  Risk Assessment Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={`px-3 py-1 ${getRiskColor(analysis.riskLevel)}`}>
                      {analysis.riskLevel.toUpperCase()} RISK
                    </Badge>
                    <span className="text-2xl font-bold">{analysis.riskScore}/100</span>
                  </div>
                  <Progress value={analysis.riskScore} className="w-full" />
                  <p className="text-gray-700 dark:text-gray-300">{analysis.summary}</p>
                </div>
              </CardContent>
            </Card>

            {/* Company & Job Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Company Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Health Score</span>
                      <span className="font-bold">{analysis.companyHealth.score}/100</span>
                    </div>
                    <Progress value={analysis.companyHealth.score} />
                    <div className="space-y-2">
                      {analysis.companyHealth.factors.map((factor, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          • {factor}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Job Title Risk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Role Security</span>
                      <span className="font-bold">{analysis.jobTitleRisk.score}/100</span>
                    </div>
                    <Progress value={analysis.jobTitleRisk.score} />
                    <div className="space-y-2">
                      {analysis.jobTitleRisk.trends.map((trend, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          • {trend}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Market Outlook */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Market Outlook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300">{analysis.marketOutlook}</p>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold text-red-600 mb-3">Immediate Actions</h4>
                    <ul className="space-y-2">
                      {analysis.recommendations.immediate.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-600 mb-3">Short-term (1-6 months)</h4>
                    <ul className="space-y-2">
                      {analysis.recommendations.shortTerm.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3">Long-term (6+ months)</h4>
                    <ul className="space-y-2">
                      {analysis.recommendations.longTerm.map((rec, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skill Gaps */}
            {analysis.skillGaps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Skill Development Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skillGaps.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}