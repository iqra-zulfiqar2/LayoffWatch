import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mail, 
  Sparkles, 
  Copy, 
  Download, 
  RefreshCw,
  Star,
  Target,
  FileText,
  Wand2
} from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";

export default function CoverLetterGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("professional");
  const [experience, setExperience] = useState("");

  const generateCoverLetter = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      const sampleLetter = `Dear Hiring Manager,

I am excited to apply for the ${jobTitle || "[Position]"} role at ${companyName || "[Company]"}. With my background in ${experience || "relevant field"}, I am confident that I can contribute meaningfully to your team.

${jobDescription ? `Having reviewed the job description, I am particularly drawn to the opportunity to ${jobDescription.slice(0, 100)}...` : "I am impressed by your company's commitment to innovation and excellence."}

In my previous roles, I have developed strong skills in:
• Problem-solving and analytical thinking
• Team collaboration and communication
• ${experience || "Technical expertise"}

I am eager to bring my passion and expertise to ${companyName || "your organization"} and would welcome the opportunity to discuss how my background aligns with your needs.

Thank you for your consideration.

Best regards,
[Your Name]`;
      
      setGeneratedLetter(sampleLetter);
      setIsGenerating(false);
    }, 3000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <GlobalHeader />

      {/* Tool Description */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Generate Personalized Cover Letters
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Create compelling cover letters that perfectly match job descriptions and company culture using AI.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Target className="w-3 h-3 mr-1" />
              Job Matching
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
              <Wand2 className="w-3 h-3 mr-1" />
              Personalized
            </Badge>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wand2 className="w-5 h-5 mr-2 text-green-500" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Job Title</label>
                  <Input
                    placeholder="e.g., Software Engineer, Marketing Manager"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    placeholder="e.g., Google, Microsoft, Startup Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Your Relevant Experience</label>
                  <Input
                    placeholder="e.g., 5 years in software development"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tone</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Description (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste the job description here to generate a more targeted cover letter..."
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </CardContent>
            </Card>

            <Button
              onClick={generateCoverLetter}
              disabled={isGenerating || !jobTitle || !companyName}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg py-6"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating Your Cover Letter...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Cover Letter
                </>
              )}
            </Button>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Generated Cover Letter</CardTitle>
                  {generatedLetter && (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={copyToClipboard}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedLetter ? (
                  <div className="bg-white border rounded-lg p-6 min-h-[500px] font-mono text-sm whitespace-pre-wrap">
                    {generatedLetter}
                  </div>
                ) : (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center min-h-[500px] flex items-center justify-center">
                    <div>
                      <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Your cover letter will appear here</p>
                      <p className="text-sm text-gray-500">Fill in the job information and click generate</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {generatedLetter && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate with Different Tone
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Make it More Specific
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Use Different Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Cover Letter Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-green-600">Personalization</h3>
                <p className="text-sm text-gray-600">
                  Always customize your cover letter for each job application. Mention specific company details and job requirements.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-teal-600">Keep it Concise</h3>
                <p className="text-sm text-gray-600">
                  Aim for 3-4 paragraphs maximum. Hiring managers spend only seconds scanning cover letters.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-blue-600">Show Value</h3>
                <p className="text-sm text-gray-600">
                  Focus on what you can do for the company, not what the company can do for you. Highlight relevant achievements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}