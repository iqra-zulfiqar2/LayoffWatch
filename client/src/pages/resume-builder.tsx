import React, { useState } from 'react';
import { Upload, FileText, Download, ArrowLeft, ArrowRight, Linkedin, ExternalLink, Plus, Trash2, Sparkles, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import { ParsedResumeData } from '@shared/schema';

interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  style: 'modern' | 'classic' | 'minimal' | 'creative';
}

const resumeTemplates: ResumeTemplate[] = [
  {
    id: 'professional',
    name: 'Professional Blue',
    description: 'Clean design with blue accents, perfect for tech and business roles',
    preview: '/api/template-preview/professional',
    style: 'modern'
  },
  {
    id: 'harvard',
    name: 'Harvard Classic',
    description: 'Traditional academic format ideal for education and research positions',
    preview: '/api/template-preview/harvard',
    style: 'classic'
  },
  {
    id: 'creative',
    name: 'Creative Modern',
    description: 'Two-column design with sidebar for creative and marketing professionals',
    preview: '/api/template-preview/creative',
    style: 'creative'
  }
];

export default function ResumeBuilder() {
  const [currentStep, setCurrentStep] = useState<'select' | 'upload' | 'linkedin-url' | 'manual-form' | 'ai-prompt' | 'templates' | 'preview'>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ParsedResumeData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState<string>('');
  const [buildMethod, setBuildMethod] = useState<'upload' | 'linkedin' | 'manual' | 'ai' | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [manualData, setManualData] = useState<ParsedResumeData>({
    name: '',
    email: '',
    phone: '',
    profession: '',
    summary: '',
    experience: [],
    skills: [],
    education: [],
    certifications: [],
    achievements: [],
    projects: [],
    languages: ['English'],
    location: '',
    linkedin: '',
    github: '',
    website: ''
  });
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      
      // Use fetch directly for file uploads instead of apiRequest
      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setExtractedData(data.parsedData);
      setCurrentStep('templates');
      toast({
        title: "Resume Extracted Successfully",
        description: "Your resume information has been processed. Choose a template below.",
      });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process your resume. Please try again.",
        variant: "destructive",
      });
    },
  });

  const linkedinImportMutation = useMutation({
    mutationFn: async (profileUrl: string) => {
      console.log("Starting LinkedIn import for:", profileUrl);
      const response = await apiRequest('POST', '/api/import-linkedin-resume', { profileUrl });
      const result = await response.json();
      console.log("LinkedIn import API result:", result);
      return result;
    },
    onSuccess: (data: any) => {
      console.log("LinkedIn import onSuccess called with:", data);
      console.log("Resume data to set:", data.resumeData);
      
      if (data.resumeData) {
        setExtractedData(data.resumeData);
        setCurrentStep('templates');
        toast({
          title: "LinkedIn Profile Imported Successfully",
          description: "Your profile information has been extracted and is ready for template selection.",
        });
      } else {
        console.error("No resumeData in response:", data);
        toast({
          title: "Import Failed",
          description: "No profile data was extracted. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("LinkedIn import error:", error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import LinkedIn profile. Please check the URL and try again.",
        variant: "destructive",
      });
    }
  });

  const generateResumeMutation = useMutation({
    mutationFn: async (data: { templateId: string; resumeData: ParsedResumeData }) => {
      try {
        console.log('generateResumeMutation starting with data:', data);
        
        const response = await fetch('/api/generate-resume-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        
        console.log('API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        const htmlContent = await response.text();
        console.log('Resume HTML generated successfully, length:', htmlContent.length);
        return htmlContent;
      } catch (error) {
        console.error('Error in generateResumeMutation:', error);
        throw error;
      }
    },
    onSuccess: (htmlContent) => {
      try {
        // Open HTML in new window for printing to PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          
          // Auto-trigger print dialog after a brief delay
          setTimeout(() => {
            printWindow.print();
          }, 500);
          
          toast({
            title: "Resume Generated Successfully",
            description: "A new window opened with your resume. Use Ctrl+P (or Cmd+P) to save as PDF.",
          });
        } else {
          // Fallback if popup is blocked
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${extractedData?.name || 'resume'}_${selectedTemplate}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Resume Downloaded",
            description: "Your resume has been downloaded as an HTML file. Open it in a browser and print to PDF.",
          });
        }
      } catch (error) {
        console.error('Error handling resume generation success:', error);
        toast({
          title: "Display Error",
          description: "Resume generated but couldn't open in new window. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Resume generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate your resume. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleExtractInformation = () => {
    console.log("Extract information clicked");
    console.log("Selected file:", selectedFile);
    
    if (selectedFile) {
      console.log("Starting upload for file:", selectedFile.name, selectedFile.type, selectedFile.size);
      setIsProcessing(true);
      uploadMutation.mutate(selectedFile);
    } else {
      console.log("No file selected");
      toast({
        title: "No File Selected",
        description: "Please select a file first.",
        variant: "destructive",
      });
    }
  };

  const handleLinkedinImport = async () => {
    if (!linkedinUrl) {
      toast({
        title: "LinkedIn URL Required",
        description: "Please enter your LinkedIn profile URL.",
        variant: "destructive",
      });
      return;
    }

    if (!linkedinUrl.includes('linkedin.com')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid LinkedIn profile URL.",
        variant: "destructive",
      });
      return;
    }

    try {
      await linkedinImportMutation.mutateAsync(linkedinUrl);
    } catch (error) {
      console.error("LinkedIn import failed:", error);
    }
  };

  const handleGenerateResume = () => {
    console.log("Generate Resume button clicked");
    console.log("extractedData:", extractedData);
    console.log("selectedTemplate:", selectedTemplate);
    console.log("generateResumeMutation.isPending:", generateResumeMutation.isPending);
    
    if (!extractedData) {
      console.error("No extracted data available");
      toast({
        title: "No Data Available",
        description: "Please upload a resume or import from LinkedIn first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedTemplate) {
      console.error("No template selected");
      toast({
        title: "No Template Selected",
        description: "Please select a template first.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Starting resume generation...");
    generateResumeMutation.mutate({
      templateId: selectedTemplate,
      resumeData: extractedData
    });
  };

  const handleManualDataSave = () => {
    // Validate required fields
    const fullName = manualData.name.trim();
    const email = manualData.email.trim();
    const profession = manualData.profession.trim();
    
    console.log("Validation check:", { fullName, email, profession });
    
    if (!fullName || !email || !profession) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in the following required fields: ${[
          !fullName ? 'Full Name' : '',
          !email ? 'Email' : '',
          !profession ? 'Professional Title' : ''
        ].filter(Boolean).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Set the manual data as extracted data and proceed to templates
    setExtractedData({
      ...manualData,
      name: fullName,
      email: email,
      profession: profession
    });
    setCurrentStep('templates');
    toast({
      title: "Information Saved",
      description: "Your resume information has been saved. Choose a template below.",
    });
  };

  const aiGenerateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      console.log("AI generate mutation starting with prompt:", prompt);
      return await apiRequest('POST', '/api/generate-resume-ai', { prompt });
    },
    onSuccess: (data) => {
      console.log("AI generation successful:", data);
      setExtractedData(data.parsedData);
      setCurrentStep('templates');
      toast({
        title: "Resume Generated",
        description: "Your resume has been generated from your description. Choose a template below.",
      });
    },
    onError: (error) => {
      console.error("AI generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate your resume. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAiGenerate = () => {
    if (!aiPrompt.trim() || aiPrompt.trim().length < 50) {
      toast({
        title: "Description Too Short",
        description: "Please provide at least 50 characters describing your career background.",
        variant: "destructive",
      });
      return;
    }

    aiGenerateMutation.mutate(aiPrompt);
  };

  const renderAiPromptStep = () => {
    const examplePrompts = [
      "I'm a software engineer with 5 years of experience in React and Node.js, looking to transition to a senior role.",
      "Recent marketing graduate with internship experience at social media companies, seeking entry-level positions.",
      "Experienced project manager transitioning from construction to tech industry, with PMP certification.",
      "Data scientist with PhD in Statistics and 3 years in healthcare analytics, targeting fintech roles."
    ];

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="bg-purple-50 dark:bg-purple-950 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Generate Resume with AI
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Describe your career background, skills, and goals. Our AI will create a professional resume for you.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-8 mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
            <span className="text-sm font-medium text-purple-600">Choose Option</span>
          </div>
          <div className="w-16 h-px bg-gray-300"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
            <span className="text-sm font-medium text-purple-600">Select Template</span>
          </div>
          <div className="w-16 h-px bg-gray-300"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
            <span className="text-sm font-medium text-gray-600">Preview & Download</span>
          </div>
        </div>

        <Card>
          <CardContent className="p-8 space-y-6">
            <div>
              <Label htmlFor="career-description" className="text-lg font-semibold text-gray-900 dark:text-white">
                Describe your career background
              </Label>
              <Textarea
                id="career-description"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Tell us about your professional experience, education, skills, and career goals. The more details you provide, the better your resume will be..."
                className="mt-2 min-h-[120px] resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                <span>{aiPrompt.length}/500 characters (minimum 50 required)</span>
                <span className={aiPrompt.length >= 50 ? "text-green-600" : "text-red-500"}>
                  {aiPrompt.length >= 50 ? "✓ Good length" : "Need more details"}
                </span>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  Example prompts:
                </h3>
              </div>
              <div className="space-y-3">
                {examplePrompts.map((prompt, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900 transition-colors"
                    onClick={() => setAiPrompt(prompt)}
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                      "{prompt}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <Button
                onClick={() => setCurrentStep('select')}
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Options
              </Button>
              <Button
                onClick={handleAiGenerate}
                disabled={aiPrompt.trim().length < 50 || aiGenerateMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8"
              >
                {aiGenerateMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Generating Resume...
                  </>
                ) : (
                  <>
                    Generate Resume with AI
                    <Sparkles className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderManualFormStep = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="bg-blue-50 dark:bg-blue-950 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
          <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          AI-Powered Resume Builder
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Create an ATS-friendly, professional resume that stands out to recruiters and hiring managers
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
          <span className="text-sm font-medium text-blue-600">Choose Option</span>
        </div>
        <div className="w-16 h-px bg-gray-300"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
          <span className="text-sm font-medium text-blue-600">Fill Details</span>
        </div>
        <div className="w-16 h-px bg-gray-300"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
          <span className="text-sm font-medium text-gray-600">Select Template</span>
        </div>
        <div className="w-16 h-px bg-gray-300"></div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
          <span className="text-sm font-medium text-gray-600">Preview & Download</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-8">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-9 mb-8">
              <TabsTrigger value="personal" className="text-xs">Personal Info</TabsTrigger>
              <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
              <TabsTrigger value="experience" className="text-xs">Experience</TabsTrigger>
              <TabsTrigger value="education" className="text-xs">Education</TabsTrigger>
              <TabsTrigger value="skills" className="text-xs">Skills</TabsTrigger>
              <TabsTrigger value="projects" className="text-xs">Projects</TabsTrigger>
              <TabsTrigger value="certifications" className="text-xs">Certifications</TabsTrigger>
              <TabsTrigger value="awards" className="text-xs">Awards</TabsTrigger>
              <TabsTrigger value="publications" className="text-xs">Publications</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={manualData.name.split(' ')[0] || ''}
                    onChange={(e) => {
                      const lastName = manualData.name.split(' ').slice(1).join(' ');
                      setManualData({...manualData, name: `${e.target.value} ${lastName}`.trim()});
                    }}
                    placeholder="John"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={manualData.name.split(' ').slice(1).join(' ') || ''}
                    onChange={(e) => {
                      const firstName = manualData.name.split(' ')[0] || '';
                      setManualData({...manualData, name: `${firstName} ${e.target.value}`.trim()});
                    }}
                    placeholder="Doe"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={manualData.email}
                    onChange={(e) => setManualData({...manualData, email: e.target.value})}
                    placeholder="john.doe@email.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={manualData.phone}
                    onChange={(e) => setManualData({...manualData, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={manualData.location}
                  onChange={(e) => setManualData({...manualData, location: e.target.value})}
                  placeholder="123 Main Street"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    placeholder="NY"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    placeholder="10001"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Professional Links</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
                    <Input
                      id="linkedinProfile"
                      value={manualData.linkedin}
                      onChange={(e) => setManualData({...manualData, linkedin: e.target.value})}
                      placeholder="https://linkedin.com/in/johndoe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="githubProfile">GitHub Profile</Label>
                    <Input
                      id="githubProfile"
                      value={manualData.github}
                      onChange={(e) => setManualData({...manualData, github: e.target.value})}
                      placeholder="https://github.com/johndoe"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="personalWebsite">Personal Website</Label>
                    <Input
                      id="personalWebsite"
                      value={manualData.website}
                      onChange={(e) => setManualData({...manualData, website: e.target.value})}
                      placeholder="https://johndoe.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="portfolio">Portfolio</Label>
                    <Input
                      id="portfolio"
                      placeholder="https://portfolio.johndoe.com"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="summary" className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Professional Summary *</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Write a compelling summary of your professional background
              </p>
              
              <div>
                <Label htmlFor="profession">Professional Title *</Label>
                <Input
                  id="profession"
                  value={manualData.profession}
                  onChange={(e) => setManualData({...manualData, profession: e.target.value})}
                  placeholder="e.g., Software Engineer, Marketing Manager"
                  className="mt-1 mb-4"
                />
              </div>

              <div>
                <Textarea
                  value={manualData.summary}
                  onChange={(e) => setManualData({...manualData, summary: e.target.value})}
                  placeholder="Experienced software engineer with 5+ years developing scalable web applications. Proven track record of leading cross-functional teams and delivering high-quality solutions that drive business growth..."
                  className="min-h-[120px]"
                />
              </div>
            </TabsContent>

            {/* Add other tabs as needed */}
            <TabsContent value="experience" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Work Experience</h3>
                <Button
                  onClick={() => {
                    const newExp = {
                      title: '',
                      company: '',
                      duration: '',
                      description: '',
                      responsibilities: []
                    };
                    setManualData({...manualData, experience: [...manualData.experience, newExp]});
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Experience
                </Button>
              </div>

              {manualData.experience.map((exp, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Job Title</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) => {
                          const newExp = [...manualData.experience];
                          newExp[index] = {...exp, title: e.target.value};
                          setManualData({...manualData, experience: newExp});
                        }}
                        placeholder="Software Engineer"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => {
                          const newExp = [...manualData.experience];
                          newExp[index] = {...exp, company: e.target.value};
                          setManualData({...manualData, experience: newExp});
                        }}
                        placeholder="Company Name"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <Label>Duration</Label>
                    <Input
                      value={exp.duration}
                      onChange={(e) => {
                        const newExp = [...manualData.experience];
                        newExp[index] = {...exp, duration: e.target.value};
                        setManualData({...manualData, experience: newExp});
                      }}
                      placeholder="Jan 2020 - Present"
                      className="mt-1"
                    />
                  </div>
                  <div className="mb-4">
                    <Label>Description</Label>
                    <Textarea
                      value={exp.description}
                      onChange={(e) => {
                        const newExp = [...manualData.experience];
                        newExp[index] = {...exp, description: e.target.value};
                        setManualData({...manualData, experience: newExp});
                      }}
                      placeholder="Brief description of your role and responsibilities"
                      className="mt-1"
                    />
                  </div>
                  {manualData.experience.length > 1 && (
                    <Button
                      onClick={() => {
                        const newExp = manualData.experience.filter((_, i) => i !== index);
                        setManualData({...manualData, experience: newExp});
                      }}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </Card>
              ))}

              {manualData.experience.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No work experience added yet. Click "Add Experience" to get started.</p>
                </div>
              )}
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Skills</h3>
                <Button
                  onClick={() => {
                    setManualData({...manualData, skills: [...manualData.skills, '']});
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skill
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {manualData.skills.map((skill, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      value={skill}
                      onChange={(e) => {
                        const newSkills = [...manualData.skills];
                        newSkills[index] = e.target.value;
                        setManualData({...manualData, skills: newSkills});
                      }}
                      placeholder="e.g., JavaScript, Project Management"
                    />
                    <Button
                      onClick={() => {
                        const newSkills = manualData.skills.filter((_, i) => i !== index);
                        setManualData({...manualData, skills: newSkills});
                      }}
                      variant="outline"
                      size="sm"
                      className="px-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {manualData.skills.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No skills added yet. Click "Add Skill" to get started.</p>
                </div>
              )}
            </TabsContent>

            {/* Add placeholder tabs for other sections */}
            <TabsContent value="education" className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Education (Coming Soon)</h3>
              <p className="text-gray-600 dark:text-gray-400">Education section will be available in the next update.</p>
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Projects (Coming Soon)</h3>
              <p className="text-gray-600 dark:text-gray-400">Projects section will be available in the next update.</p>
            </TabsContent>

            <TabsContent value="certifications" className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Certifications (Coming Soon)</h3>
              <p className="text-gray-600 dark:text-gray-400">Certifications section will be available in the next update.</p>
            </TabsContent>

            <TabsContent value="awards" className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Awards (Coming Soon)</h3>
              <p className="text-gray-600 dark:text-gray-400">Awards section will be available in the next update.</p>
            </TabsContent>

            <TabsContent value="publications" className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Publications (Coming Soon)</h3>
              <p className="text-gray-600 dark:text-gray-400">Publications section will be available in the next update.</p>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-8 border-t">
            <Button
              onClick={() => setCurrentStep('select')}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleManualDataSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              Save & Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSelectStep = () => (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      <div className="bg-blue-50 dark:bg-blue-950 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
        <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Build Your Resume
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Choose how you'd like to get started with your resume
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Resume Option */}
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer group"
              onClick={() => {
                setBuildMethod('upload');
                setCurrentStep('upload');
              }}>
          <CardContent className="p-8 text-center">
            <div className="bg-blue-50 dark:bg-blue-950 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
              <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Select An Existing Resume
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Upload your current resume and we'll extract all the information to build upon
            </p>
            <Button variant="outline" className="mt-2">
              Upload Resume
            </Button>
          </CardContent>
        </Card>

        {/* LinkedIn Import Option */}
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer group"
              onClick={() => {
                setBuildMethod('linkedin');
                setCurrentStep('linkedin-url');
              }}>
          <CardContent className="p-8 text-center">
            <div className="bg-blue-50 dark:bg-blue-950 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
              <Linkedin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Build Using LinkedIn
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Import your professional information directly from your LinkedIn profile
            </p>
            <Button variant="outline" className="mt-2">
              Connect LinkedIn
            </Button>
          </CardContent>
        </Card>

        {/* Start With AI Prompt Option */}
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer group"
              onClick={() => {
                setBuildMethod('ai');
                setCurrentStep('ai-prompt');
              }}>
          <CardContent className="p-8 text-center">
            <div className="bg-purple-50 dark:bg-purple-950 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-100 dark:group-hover:bg-purple-900 transition-colors">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Start With AI Prompt
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Describe your career and let AI create a professional resume for you
            </p>
            <Button variant="outline" className="mt-2">
              Start with AI
            </Button>
          </CardContent>
        </Card>

        {/* Choose A Blank Template Option */}
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 transition-colors cursor-pointer group"
              onClick={() => {
                setBuildMethod('manual');
                setCurrentStep('manual-form');
              }}>
          <CardContent className="p-8 text-center">
            <div className="bg-green-50 dark:bg-green-950 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 group-hover:bg-green-100 dark:group-hover:bg-green-900 transition-colors">
              <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Choose A Blank Template
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Start from scratch with a clean template and fill in your details manually
            </p>
            <Button variant="outline" className="mt-2">
              Start Building
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderLinkedinUrlStep = () => (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <div className="bg-blue-50 dark:bg-blue-950 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
        <Linkedin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Import from LinkedIn
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Enter your LinkedIn profile URL to automatically import your professional information
        </p>
      </div>

      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="linkedin-url" className="text-left block">
              LinkedIn Profile URL
            </Label>
            <Input
              id="linkedin-url"
              type="url"
              placeholder="https://www.linkedin.com/in/your-profile"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-left">
              Make sure your LinkedIn profile is set to public or has basic information visible
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => setCurrentStep('select')}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleLinkedinImport}
              disabled={linkedinImportMutation.isPending || !linkedinUrl}
              className="flex-1"
            >
              {linkedinImportMutation.isPending ? (
                "Importing..."
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Import from LinkedIn
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-left bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How to find your LinkedIn URL:</h3>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
          <li>Go to your LinkedIn profile page</li>
          <li>Copy the URL from your browser's address bar</li>
          <li>It should look like: https://www.linkedin.com/in/your-name</li>
        </ol>
      </div>
    </div>
  );

  const renderUploadStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
          AI-Powered Resume Builder
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Create an ATS-friendly, professional resume that stands out to recruiters and hiring managers
        </p>
      </div>

      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-sm font-medium">1</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Choose Option</span>
          </div>
          <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">2</span>
            </div>
            <span className="text-sm text-blue-600 dark:text-blue-400">Select Template</span>
          </div>
          <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-sm font-medium">3</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Preview & Download</span>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload Your Existing Resume</span>
          </CardTitle>
          <CardDescription>
            Upload your current resume and our AI will extract all the information to build upon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="resume-file">Choose your resume file</Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Click to upload your resume</p>
                <p className="text-sm text-gray-500">PDF, DOC, or DOCX files only</p>
              </div>
              <Input
                id="resume-file"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Label 
                htmlFor="resume-file" 
                className="mt-4 inline-block cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose File
              </Label>
            </div>
            {selectedFile && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Selected: {selectedFile.name}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep('select')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Options
            </Button>
            <Button 
              onClick={handleExtractInformation}
              disabled={!selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Processing...' : 'Extract Information'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTemplatesStep = () => (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Choose Your Resume Template</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Select from our professionally designed templates
        </p>
      </div>

      {extractedData && (
        <div className="mb-8 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">✓ Information Extracted Successfully</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span> {extractedData.name}
            </div>
            <div>
              <span className="font-medium">Email:</span> {extractedData.email}
            </div>
            <div>
              <span className="font-medium">Profession:</span> {extractedData.profession}
            </div>
            <div>
              <span className="font-medium">Skills:</span> {Array.isArray(extractedData.skills) ? extractedData.skills.slice(0, 3).join(', ') : extractedData.skills}
            </div>
            <div>
              <span className="font-medium">Education:</span> {Array.isArray(extractedData.education) ? extractedData.education[0]?.degree : extractedData.education}
            </div>
            <div>
              <span className="font-medium">Location:</span> {extractedData.location}
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resumeTemplates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedTemplate === template.id 
                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
                : 'border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <CardContent className="p-6">
              <div className="aspect-[3/4] bg-white rounded-lg mb-4 border border-gray-200 overflow-hidden">
                {template.id === 'professional' && (
                  <div className="w-full h-full p-3 text-xs">
                    <div className="text-center border-b-2 border-blue-500 pb-2 mb-2">
                      <div className="font-bold text-lg">John Doe</div>
                      <div className="text-gray-600">Software Engineer</div>
                      <div className="text-xs">john@email.com | (555) 123-4567</div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-semibold text-blue-600">PROFESSIONAL SUMMARY</div>
                      <div className="h-2 bg-gray-200 rounded"></div>
                      <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                      <div className="font-semibold text-blue-600 mt-3">EXPERIENCE</div>
                      <div className="h-1 bg-gray-200 rounded"></div>
                      <div className="h-1 bg-gray-200 rounded w-2/3"></div>
                      <div className="font-semibold text-blue-600 mt-3">SKILLS</div>
                      <div className="flex gap-1">
                        <div className="h-1 bg-blue-200 rounded w-8"></div>
                        <div className="h-1 bg-blue-200 rounded w-6"></div>
                        <div className="h-1 bg-blue-200 rounded w-10"></div>
                      </div>
                    </div>
                  </div>
                )}
                {template.id === 'harvard' && (
                  <div className="w-full h-full p-3 text-xs font-serif">
                    <div className="text-center mb-3">
                      <div className="font-bold text-lg">JOHN DOE</div>
                      <div className="text-gray-600">123 Main St | john@email.com</div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-bold underline">EDUCATION</div>
                      <div className="h-1 bg-gray-200 rounded"></div>
                      <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                      <div className="font-bold underline mt-3">EXPERIENCE</div>
                      <div className="h-1 bg-gray-200 rounded"></div>
                      <div className="h-1 bg-gray-200 rounded w-2/3"></div>
                      <div className="font-bold underline mt-3">SKILLS</div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="h-1 bg-gray-200 rounded"></div>
                        <div className="h-1 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                )}
                {template.id === 'creative' && (
                  <div className="w-full h-full flex">
                    <div className="w-2/5 bg-blue-900 text-white p-2 text-xs">
                      <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-1"></div>
                      <div className="text-center font-bold mb-2">CONTACT</div>
                      <div className="space-y-1">
                        <div className="h-1 bg-blue-300 rounded"></div>
                        <div className="h-1 bg-blue-300 rounded w-3/4"></div>
                      </div>
                      <div className="text-center font-bold mt-2 mb-1">SKILLS</div>
                      <div className="space-y-1">
                        <div className="h-1 bg-blue-300 rounded"></div>
                        <div className="h-1 bg-blue-300 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="w-3/5 p-2 text-xs">
                      <div className="font-bold text-lg mb-1">John Doe</div>
                      <div className="text-gray-600 mb-2">Creative Designer</div>
                      <div className="font-semibold mb-1">PROFILE</div>
                      <div className="space-y-1">
                        <div className="h-1 bg-gray-200 rounded"></div>
                        <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="font-semibold mt-2 mb-1">EXPERIENCE</div>
                      <div className="space-y-1">
                        <div className="h-1 bg-gray-200 rounded"></div>
                        <div className="h-1 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{template.name}</h3>
                  <Badge variant={template.style === 'modern' ? 'default' : 'secondary'}>
                    {template.style}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {template.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <Button 
          variant="outline" 
          onClick={() => {
            if (buildMethod === 'linkedin') {
              setCurrentStep('linkedin-url');
            } else if (buildMethod === 'manual') {
              setCurrentStep('manual-form');
            } else if (buildMethod === 'ai') {
              setCurrentStep('ai-prompt');
            } else {
              setCurrentStep('upload');
            }
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {buildMethod === 'linkedin' ? 'Back to LinkedIn' : 
           buildMethod === 'manual' ? 'Back to Form' : 
           buildMethod === 'ai' ? 'Back to AI Prompt' : 'Back to Upload'}
        </Button>
        <Button 
          onClick={handleGenerateResume}
          disabled={!selectedTemplate || generateResumeMutation.isPending}
        >
          {generateResumeMutation.isPending ? 'Generating...' : 'Generate & Download Resume'}
          <Download className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="container mx-auto">
        {currentStep === 'select' && renderSelectStep()}
        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'linkedin-url' && renderLinkedinUrlStep()}
        {currentStep === 'ai-prompt' && renderAiPromptStep()}
        {currentStep === 'manual-form' && renderManualFormStep()}
        {currentStep === 'templates' && renderTemplatesStep()}
      </div>
    </div>
  );
}