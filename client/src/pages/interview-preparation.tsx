import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Users, 
  Play, 
  Pause, 
  RotateCcw, 
  Mic,
  MicOff,
  Clock,
  Target,
  TrendingUp,
  Star
} from "lucide-react";

const questionCategories = [
  { id: "behavioral", name: "Behavioral", count: 50 },
  { id: "technical", name: "Technical", count: 75 },
  { id: "situational", name: "Situational", count: 40 },
  { id: "leadership", name: "Leadership", count: 30 },
  { id: "culture-fit", name: "Culture Fit", count: 25 }
];

const industries = [
  "Technology", "Finance", "Healthcare", "Marketing", "Sales", 
  "Consulting", "Education", "Non-profit", "Government", "Retail"
];

export default function InterviewPreparation() {
  const [selectedCategory, setSelectedCategory] = useState("behavioral");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);

  const sampleQuestions = {
    behavioral: [
      "Tell me about a time when you had to overcome a significant challenge at work.",
      "Describe a situation where you had to work with a difficult team member.",
      "Give me an example of when you had to learn something new quickly."
    ],
    technical: [
      "Explain the difference between REST and GraphQL APIs.",
      "How would you optimize a slow-running database query?",
      "Describe the trade-offs between different data structures."
    ],
    situational: [
      "How would you handle a situation where you disagree with your manager?",
      "What would you do if you discovered a critical bug just before a product launch?",
      "How would you prioritize tasks when everything seems urgent?"
    ]
  };

  const startInterview = () => {
    const questions = sampleQuestions[selectedCategory as keyof typeof sampleQuestions] || [];
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQuestion);
    setIsRecording(true);
    setTimeElapsed(0);
  };

  const stopInterview = () => {
    setIsRecording(false);
    setIsPaused(false);
    setCurrentQuestion("");
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Tools</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Users className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Interview Preparation</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="hidden sm:inline-flex">
                <TrendingUp className="w-4 h-4 mr-2" />
                Progress
              </Button>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Tool Description */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 border-b bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Master Your Interview Skills
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Practice with AI-powered mock interviews tailored to your industry and specific job roles.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Target className="w-3 h-3 mr-1" />
              Industry-specific
            </Badge>
            <Badge variant="secondary" className="bg-pink-100 text-pink-800">
              <Users className="w-3 h-3 mr-1" />
              Mock interviews
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <TrendingUp className="w-3 h-3 mr-1" />
              Performance feedback
            </Badge>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Setup Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Interview Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Question Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({category.count} questions)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Industry</label>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry.toLowerCase()}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Job Level</label>
                  <Select value={jobLevel} onValueChange={setJobLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="lead">Lead/Manager</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={startInterview}
                  disabled={isRecording}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Mock Interview
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Question Bank</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {questionCategories.map((category) => (
                    <div key={category.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.count} questions</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Practice
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interview Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Interview Session</CardTitle>
                  {isRecording && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isRecording && !currentQuestion ? (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Start?</h3>
                    <p className="text-gray-600 mb-4">
                      Select your preferences and click "Start Mock Interview" to begin practicing.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Current Question */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">Current Question:</h3>
                      <p className="text-blue-800">{currentQuestion}</p>
                    </div>

                    {/* Recording Controls */}
                    <div className="flex justify-center space-x-4">
                      <Button
                        variant="outline"
                        onClick={togglePause}
                        disabled={!isRecording}
                      >
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => setIsRecording(!isRecording)}
                        className={isRecording ? "bg-red-50 border-red-200" : ""}
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                      
                      <Button variant="outline" onClick={stopInterview}>
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Recording Indicator */}
                    {isRecording && !isPaused && (
                      <div className="flex justify-center">
                        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-full px-4 py-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-red-700 text-sm font-medium">Recording in progress...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips & Feedback */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interview Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                      <span>Use the STAR method (Situation, Task, Action, Result) for behavioral questions</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                      <span>Take a moment to think before answering</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                      <span>Be specific with examples and quantify results when possible</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                      <span>Ask clarifying questions if needed</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Practice Sessions</span>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Questions Answered</span>
                      <span className="font-semibold">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Response Time</span>
                      <span className="font-semibold">--</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Confidence Score</span>
                      <span className="font-semibold">--</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}