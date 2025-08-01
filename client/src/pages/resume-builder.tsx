import { useState, useRef } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  Trash2, 
  Sparkles,
  CheckCircle,
  Star,
  Zap
} from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";

const resumeSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(1, "Phone number is required"),
    location: z.string().min(1, "Location is required"),
    linkedinUrl: z.string().url().optional().or(z.literal("")),
    websiteUrl: z.string().url().optional().or(z.literal(""))
  }),
  summary: z.string().min(50, "Professional summary should be at least 50 characters"),
  experience: z.array(z.object({
    company: z.string().min(1, "Company name is required"),
    position: z.string().min(1, "Position is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    current: z.boolean().default(false),
    description: z.string().min(1, "Description is required")
  })),
  education: z.array(z.object({
    institution: z.string().min(1, "Institution is required"),
    degree: z.string().min(1, "Degree is required"),
    fieldOfStudy: z.string().min(1, "Field of study is required"),
    graduationYear: z.string().min(1, "Graduation year is required")
  })),
  skills: z.array(z.string()).min(3, "At least 3 skills are required")
});

const templates = [
  {
    id: "modern",
    name: "Modern Professional",
    description: "Clean, ATS-friendly design perfect for tech and corporate roles",
    preview: "/api/placeholder/300/400",
    popular: true
  },
  {
    id: "creative",
    name: "Creative Professional",
    description: "Eye-catching design for creative and marketing professionals",
    preview: "/api/placeholder/300/400",
    popular: false
  },
  {
    id: "executive",
    name: "Executive Suite",
    description: "Sophisticated layout for senior leadership positions",
    preview: "/api/placeholder/300/400",
    popular: true
  }
];

export default function ResumeBuilder() {
  const [activeTemplate, setActiveTemplate] = useState("modern");
  const [activeTab, setActiveTab] = useState("template");
  const [isGenerating, setIsGenerating] = useState(false);
  const [experiences, setExperiences] = useState([{ id: 1 }]);
  const [educations, setEducations] = useState([{ id: 1 }]);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const form = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      personalInfo: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        location: "",
        linkedinUrl: "",
        websiteUrl: ""
      },
      summary: "",
      experience: [{}],
      education: [{}],
      skills: []
    }
  });

  const addExperience = () => {
    setExperiences([...experiences, { id: Date.now() }]);
  };

  const removeExperience = (id: number) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const addEducation = () => {
    setEducations([...educations, { id: Date.now() }]);
  };

  const removeEducation = (id: number) => {
    setEducations(educations.filter(edu => edu.id !== id));
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
      // Auto-fill with AI-generated content
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <GlobalHeader />

      {/* Tool Description */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Build ATS-Optimized Resumes
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Create professional resumes with AI assistance that get you noticed by recruiters and hiring managers.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              ATS Optimized
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Zap className="w-3 h-3 mr-1" />
              Professional Templates
            </Badge>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Builder Section */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="template">Template</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
              </TabsList>

              {/* Template Selection */}
              <TabsContent value="template">
                <Card>
                  <CardHeader>
                    <CardTitle>Choose Your Template</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                            activeTemplate === template.id
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setActiveTemplate(template.id)}
                        >
                          {template.popular && (
                            <Badge className="absolute top-2 right-2 z-10 bg-gradient-to-r from-yellow-400 to-orange-500">
                              Popular
                            </Badge>
                          )}
                          <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                            <FileText className="w-16 h-16 text-gray-400" />
                          </div>
                          <div className="p-3">
                            <h3 className="font-semibold text-sm">{template.name}</h3>
                            <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Personal Information */}
              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={generateWithAI}
                        disabled={isGenerating}
                        className="bg-gradient-to-r from-purple-500 to-pink-500"
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-3 h-3 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-2" />
                            AI Assist
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">First Name</label>
                        <Input placeholder="John" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Last Name</label>
                        <Input placeholder="Doe" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input type="email" placeholder="john.doe@email.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <Input placeholder="(555) 123-4567" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Location</label>
                        <Input placeholder="New York, NY" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">LinkedIn URL (Optional)</label>
                      <Input placeholder="https://linkedin.com/in/johndoe" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Professional Summary</label>
                      <Textarea 
                        placeholder="Write a compelling professional summary that highlights your key achievements and skills..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Experience */}
              <TabsContent value="experience">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Work Experience</CardTitle>
                      <Button size="sm" onClick={addExperience}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Experience
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {experiences.map((exp, index) => (
                      <div key={exp.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">Experience {index + 1}</h3>
                          {experiences.length > 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeExperience(exp.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Company</label>
                            <Input placeholder="Company Name" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Position</label>
                            <Input placeholder="Job Title" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium">Start Date</label>
                            <Input type="month" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">End Date</label>
                            <Input type="month" />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" />
                              <span className="text-sm">Current</span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Textarea 
                            placeholder="Describe your responsibilities and achievements..."
                            rows={3}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Education */}
              <TabsContent value="education">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Education</CardTitle>
                      <Button size="sm" onClick={addEducation}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {educations.map((edu, index) => (
                      <div key={edu.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">Education {index + 1}</h3>
                          {educations.length > 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeEducation(edu.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium">Institution</label>
                          <Input placeholder="University Name" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Degree</label>
                            <Input placeholder="Bachelor's, Master's, etc." />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Field of Study</label>
                            <Input placeholder="Computer Science, Business, etc." />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Graduation Year</label>
                          <Input type="number" placeholder="2023" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skills */}
              <TabsContent value="skills">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add a skill..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      />
                      <Button onClick={addSkill}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="cursor-pointer hover:bg-red-100"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill}
                          <Trash2 className="w-3 h-3 ml-2" />
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Resume preview will appear here</p>
                    <p className="text-sm text-gray-500">Fill in your information to see the preview</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Full Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}