import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Zap, 
  TrendingUp, 
  Shield,
  Crown,
  Sparkles,
  ArrowRight
} from "lucide-react";
import GlobalHeader from "@/components/GlobalHeader";

const pricingPlans = [
  {
    id: "weekly",
    name: "Weekly Access",
    description: "Perfect for short-term insights",
    price: "$20",
    period: "/week",
    icon: Zap,
    popular: false,
    features: [
      "Full access to layoff tracker",
      "Basic resume builder",
      "Email notifications",
      "Weekly data updates",
      "Standard support"
    ],
    limitations: [
      "Limited to 1 company tracking",
      "Basic templates only",
      "No AI assistance"
    ]
  },
  {
    id: "monthly",
    name: "Monthly Access",
    description: "Most popular choice for professionals",
    price: "$60",
    period: "/month",
    icon: TrendingUp,
    popular: true,
    features: [
      "Everything in Weekly",
      "AI-powered resume optimization",
      "Cover letter generator",
      "Interview preparation tools",
      "LinkedIn profile optimizer",
      "Priority support",
      "Advanced analytics",
      "Real-time notifications"
    ],
    limitations: [
      "Track up to 10 companies",
      "50 AI generations per month"
    ]
  },
  {
    id: "yearly",
    name: "Yearly Access",
    description: "Best value - 3 months free!",
    price: "$540",
    period: "/year",
    originalPrice: "$720",
    savings: "Save $180",
    icon: Shield,
    popular: false,
    features: [
      "Everything in Monthly",
      "Unlimited company tracking",
      "Unlimited AI generations",
      "Recruiter outreach scripts",
      "Advanced career insights",
      "Personal career coach",
      "Custom templates",
      "White-glove onboarding",
      "24/7 premium support"
    ],
    limitations: []
  }
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <GlobalHeader />
      
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 text-sm mb-6">
            <Crown className="w-4 h-4 mr-2" />
            Choose Your Protection Level
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Invest in Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              Career Security
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Protect your career with AI-powered tools that help you stay ahead of layoffs, 
            build stronger applications, and land your next opportunity faster.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => {
              const IconComponent = plan.icon;
              return (
                <Card 
                  key={plan.id}
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    plan.popular 
                      ? 'border-2 border-blue-500 shadow-lg transform scale-105' 
                      : 'border border-gray-200 hover:-translate-y-1'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 px-4">
                        <Badge className="bg-white text-blue-600 font-medium">
                          Most Popular
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  <CardHeader className={`text-center ${plan.popular ? 'mt-8' : 'mt-4'}`}>
                    <div className="flex justify-center mb-4">
                      <div className={`p-3 rounded-xl ${
                        plan.popular 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <IconComponent className="w-8 h-8" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {plan.name}
                    </CardTitle>
                    <p className="text-gray-600 mt-2">{plan.description}</p>
                    
                    <div className="mt-6">
                      <div className="flex justify-center items-baseline">
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-lg text-gray-500 ml-1">{plan.period}</span>
                      </div>
                      {plan.originalPrice && (
                        <div className="mt-2">
                          <span className="text-lg text-gray-400 line-through">{plan.originalPrice}/year</span>
                          <Badge className="ml-2 bg-green-100 text-green-800">
                            {plan.savings}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="px-6 pb-6">
                    <Button 
                      className={`w-full mb-6 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                      size="lg"
                    >
                      {plan.popular ? 'Start Free Trial' : 'Get Started'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    {/* Features */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        What's included:
                      </h4>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <Check className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {plan.limitations.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h4 className="font-semibold text-gray-700 text-sm mb-2">Limitations:</h4>
                          <ul className="space-y-1">
                            {plan.limitations.map((limitation, index) => (
                              <li key={index} className="text-xs text-gray-500">
                                • {limitation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600 text-sm">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600 text-sm">
                Yes, we offer a 7-day free trial for the Monthly and Yearly plans. No credit card required.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 text-sm">
                We accept all major credit cards, PayPal, and bank transfers for yearly subscriptions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h3>
              <p className="text-gray-600 text-sm">
                We offer a 30-day money-back guarantee if you're not satisfied with our service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <Sparkles className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">
            Start Protecting Your Career Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of professionals who are already using LayOff Proof to secure their career future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-6">
                Explore Tools
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}