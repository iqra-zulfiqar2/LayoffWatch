import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with basic career tools",
    features: [
      "Basic Resume Builder",
      "3 Resume downloads per month",
      "Basic Cover Letter Generator",
      "Access to Layoff Tracker",
      "Email support"
    ],
    limitations: [
      "Limited to 3 resume templates",
      "Basic customization options",
      "No premium features"
    ],
    buttonText: "Get Started",
    popular: false,
    color: "border-gray-200"
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "Advanced tools for serious job seekers and career changers",
    features: [
      "All Free features",
      "Unlimited resume downloads",
      "All 4 premium resume templates",
      "AI-powered Interview Preparation",
      "LinkedIn Profile Optimizer",
      "Advanced Cover Letter customization",
      "Priority email support",
      "Resume analytics and insights"
    ],
    limitations: [],
    buttonText: "Start Pro Trial",
    popular: true,
    color: "border-blue-500"
  },
  {
    name: "Premium",
    price: "$39",
    period: "per month",
    description: "Complete career advancement suite for professionals",
    features: [
      "All Pro features",
      "Recruiter Outreach Script Generator",
      "Advanced company layoff tracking",
      "Custom company monitoring (up to 50)",
      "1-on-1 career coaching session monthly",
      "Resume review by career experts",
      "Phone support",
      "Early access to new features",
      "Custom branding options"
    ],
    limitations: [],
    buttonText: "Go Premium",
    popular: false,
    color: "border-purple-500"
  }
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const getPrice = (basePrice: string) => {
    if (basePrice === "$0") return basePrice;
    if (billingCycle === "yearly") {
      const monthlyPrice = parseInt(basePrice.replace("$", ""));
      const yearlyPrice = Math.floor(monthlyPrice * 12 * 0.8); // 20% discount
      return `$${yearlyPrice}`;
    }
    return basePrice;
  };

  const getPeriod = () => {
    if (billingCycle === "yearly") return "per year";
    return "per month";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Choose Your Career Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Unlock your career potential with our comprehensive suite of AI-powered tools. 
            From resumes to interviews, we've got everything you need to land your dream job.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${billingCycle === "monthly" ? "text-gray-900 dark:text-white font-semibold" : "text-gray-500"}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                billingCycle === "yearly" ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm ${billingCycle === "yearly" ? "text-gray-900 dark:text-white font-semibold" : "text-gray-500"}`}>
              Yearly
            </span>
            {billingCycle === "yearly" && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={plan.name} className={`relative ${plan.color} ${plan.popular ? 'ring-2 ring-blue-500 shadow-xl scale-105' : 'shadow-lg hover:shadow-xl'} transition-all duration-300`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1 flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span>Most Popular</span>
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline justify-center space-x-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {getPrice(plan.price)}
                  </span>
                  {plan.price !== "$0" && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {billingCycle === "yearly" ? getPeriod() : plan.period}
                    </span>
                  )}
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-300 mt-4">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-6">
                <Button 
                  className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'} text-white`}
                  size="lg"
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Everything You Need to Succeed
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Resume Builder</h3>
              <p className="text-gray-600 dark:text-gray-300">Create professional resumes with our intelligent builder</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Interview Prep</h3>
              <p className="text-gray-600 dark:text-gray-300">Practice with AI-generated questions and get scored feedback</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Layoff Tracker</h3>
              <p className="text-gray-600 dark:text-gray-300">Stay informed about industry layoffs and company health</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">LinkedIn Optimizer</h3>
              <p className="text-gray-600 dark:text-gray-300">Optimize your LinkedIn profile for maximum visibility</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I switch plans anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Is there a free trial for paid plans?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Yes, we offer a 14-day free trial for both Pro and Premium plans. No credit card required to start your trial.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What happens to my data if I cancel?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your data remains accessible for 30 days after cancellation. You can export your resumes and other documents during this period.
              </p>
            </div>
          </div>
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
}