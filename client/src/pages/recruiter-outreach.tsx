import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Copy, 
  Send, 
  Sparkles,
  Mail,
  Linkedin,
  Users,
  Target,
  RefreshCw,
  CheckCircle,
  Clock
} from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";

const messageTypes = [
  { id: "linkedin-dm", name: "LinkedIn DM", icon: Linkedin },
  { id: "email", name: "Cold Email", icon: Mail },
  { id: "referral", name: "Referral Request", icon: Users }
];

const industries = [
  "Technology", "Finance", "Healthcare", "Marketing", "Sales", 
  "Consulting", "Education", "Manufacturing", "Retail", "Media"
];

const experienceLevels = [
  "Entry Level (0-2 years)",
  "Mid Level (3-5 years)", 
  "Senior Level (6-10 years)",
  "Lead/Manager (10+ years)",
  "Executive (15+ years)"
];

export default function RecruiterOutreach() {
  const [activeTab, setActiveTab] = useState("linkedin-dm");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");
  
  // Form fields
  const [recruiterName, setRecruiterName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [yourName, setYourName] = useState("");
  const [yourRole, setYourRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [experience, setExperience] = useState("");
  const [tone, setTone] = useState("professional");

  const generateMessage = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      let sampleMessage = "";
      
      if (activeTab === "linkedin-dm") {
        sampleMessage = `Hi ${recruiterName || "[Recruiter Name]"},

I hope this message finds you well. I came across your profile and noticed that you're recruiting for ${jobTitle || "[Position]"} roles at ${companyName || "[Company]"}.

I'm a ${yourRole || "[Your Role]"} with ${experience || "[X years]"} of experience in ${industry || "[Industry]"}. I'm particularly interested in opportunities at ${companyName || "[Company]"} because of [specific reason about the company].

Key highlights of my background:
• [Relevant skill/achievement 1]
• [Relevant skill/achievement 2]  
• [Relevant skill/achievement 3]

I'd love to learn more about current openings and discuss how my experience could contribute to your team. Would you be open to a brief conversation?

Thank you for your time, and I look forward to hearing from you.

Best regards,
${yourName || "[Your Name]"}`;
      } else if (activeTab === "email") {
        sampleMessage = `Subject: Experienced ${yourRole || "[Your Role]"} interested in ${companyName || "[Company]"} opportunities

Dear ${recruiterName || "[Recruiter Name]"},

I hope this email finds you well. I'm reaching out regarding potential ${jobTitle || "[Position]"} opportunities at ${companyName || "[Company]"}.

With ${experience || "[X years]"} of experience in ${industry || "[Industry]"}, I've developed expertise in:
- [Key skill 1]
- [Key skill 2]
- [Key skill 3]

I'm particularly drawn to ${companyName || "[Company]"} because [specific reason]. I believe my background in [relevant experience] would be valuable for your team.

I've attached my resume for your review. Would you be available for a brief call to discuss potential opportunities?

Thank you for your consideration.

Best regards,
${yourName || "[Your Name]"}
[Your Phone]
[Your Email]`;
      } else {
        sampleMessage = `Hi [Contact Name],

I hope you're doing well! I'm reaching out because I'm currently exploring new opportunities in ${industry || "[Industry]"} and thought you might have some insights.

I'm particularly interested in ${jobTitle || "[Position]"} roles at companies like ${companyName || "[Company]"}. Given your experience at [Contact's Company], I'd love to get your perspective on the industry landscape.

If you know of any relevant openings or could introduce me to the right people, I'd be incredibly grateful. Happy to return the favor in any way I can.

Would you be free for a quick coffee chat sometime?

Thanks so much!
${yourName || "[Your Name]"}`;
      }
      
      setGeneratedMessage(sampleMessage);
      setIsGenerating(false);
    }, 2500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
  };

  const MessageTypeIcon = messageTypes.find(type => type.id === activeTab)?.icon || MessageSquare;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <GlobalHeader />

      {/* Tool Description */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Generate Personalized Outreach Scripts
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Create compelling LinkedIn DMs, cold emails, and referral requests that get noticed by recruiters.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
              <Target className="w-3 h-3 mr-1" />
              Personalized
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
            <Badge variant="secondary" className="bg-pink-100 text-pink-800">
              <MessageSquare className="w-3 h-3 mr-1" />
              Multi-platform
            </Badge>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Message Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Message Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    {messageTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <TabsTrigger key={type.id} value={type.id} className="flex items-center space-x-2">
                          <IconComponent className="w-4 h-4" />
                          <span className="hidden sm:inline">{type.name}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Form Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageTypeIcon className="w-5 h-5 mr-2" />
                  {messageTypes.find(type => type.id === activeTab)?.name} Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Your Name</label>
                    <Input
                      placeholder="John Doe"
                      value={yourName}
                      onChange={(e) => setYourName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Your Current Role</label>
                    <Input
                      placeholder="Software Engineer"
                      value={yourRole}
                      onChange={(e) => setYourRole(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Recruiter Name</label>
                    <Input
                      placeholder="Jane Smith"
                      value={recruiterName}
                      onChange={(e) => setRecruiterName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Company Name</label>
                    <Input
                      placeholder="Google, Microsoft, etc."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Target Job Title</label>
                  <Input
                    placeholder="Senior Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Industry</label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((ind) => (
                          <SelectItem key={ind} value={ind.toLowerCase()}>
                            {ind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Experience Level</label>
                    <Select value={experience} onValueChange={setExperience}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Tone</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={generateMessage}
                  disabled={isGenerating || !yourName || !recruiterName}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg py-6"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Generating Message...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate {messageTypes.find(type => type.id === activeTab)?.name}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Generated Message</CardTitle>
                  {generatedMessage && (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={copyToClipboard}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-500">
                        <Send className="w-4 h-4 mr-2" />
                        Use
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedMessage ? (
                  <div className="bg-white border rounded-lg p-6 min-h-[400px] font-mono text-sm whitespace-pre-wrap">
                    {generatedMessage}
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
                    <div>
                      <MessageTypeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Your personalized message will appear here</p>
                      <p className="text-sm text-gray-500">Fill in the details and click generate</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {generatedMessage && (
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Suggestions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Personalization Score: 85%</p>
                      <p className="text-xs text-gray-600">Great job including specific details about the company</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Length: Optimal</p>
                      <p className="text-xs text-gray-600">Message is concise and to the point</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Target className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Call to Action: Clear</p>
                      <p className="text-xs text-gray-600">Consider being more specific about next steps</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Alternative Version
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Make it More Personal
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Create Follow-up Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Outreach Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-indigo-600">Research First</h3>
                <p className="text-sm text-gray-600">
                  Always research the recruiter and company before reaching out. Mention specific details to show genuine interest.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-purple-600">Be Concise</h3>
                <p className="text-sm text-gray-600">
                  Keep messages short and focused. Recruiters are busy - make your value proposition clear quickly.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-pink-600">Follow Up</h3>
                <p className="text-sm text-gray-600">
                  If you don't hear back in a week, send a polite follow-up. Persistence shows genuine interest.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}