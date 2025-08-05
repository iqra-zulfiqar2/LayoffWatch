import React, { useState } from 'react';
import { Upload, FileText, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  const [currentStep, setCurrentStep] = useState<'select' | 'upload' | 'templates' | 'preview'>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ParsedResumeData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
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

  const generateResumeMutation = useMutation({
    mutationFn: async (data: { templateId: string; resumeData: ParsedResumeData }) => {
      try {
        const response = await fetch('/api/generate-resume-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        const htmlContent = await response.text();
        console.log('Resume HTML generated successfully');
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

  const handleGenerateResume = () => {
    if (extractedData && selectedTemplate) {
      generateResumeMutation.mutate({
        templateId: selectedTemplate,
        resumeData: extractedData
      });
    }
  };

  const renderSelectStep = () => (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      <div className="bg-blue-50 dark:bg-blue-950 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
        <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Select An Existing Resume
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Upload your current resume and we'll extract all the information to build upon
        </p>
      </div>

      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
        <CardContent className="p-8">
          <Button 
            onClick={() => setCurrentStep('upload')}
            className="w-full h-12 text-lg"
            size="lg"
          >
            Upload Resume
          </Button>
        </CardContent>
      </Card>
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
          onClick={() => setCurrentStep('upload')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
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
        {currentStep === 'templates' && renderTemplatesStep()}
      </div>
    </div>
  );
}