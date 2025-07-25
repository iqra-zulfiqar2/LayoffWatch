import { useState } from "react";
import { Check, X, Crown, Zap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "../components/ui/header";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with layoff tracking",
    features: [
      "Track 1 company",
      "Basic layoff notifications",
      "Limited historical data",
      "Email support"
    ],
    limitations: [
      "No SMS notifications",
      "Limited analytics",
      "No priority alerts"
    ],
    buttonText: "Current Plan",
    popular: false,
    plan: "free"
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "month",
    description: "Enhanced tracking for serious professionals",
    features: [
      "Track up to 5 companies",
      "Email & SMS notifications",
      "Full historical analytics",
      "Priority email alerts",
      "Advanced filtering",
      "Export data capabilities"
    ],
    limitations: [],
    buttonText: "Upgrade to Pro",
    popular: true,
    plan: "pro"
  },
  {
    name: "Premium",
    price: "$19.99",
    period: "month", 
    description: "Complete solution for teams and enterprises",
    features: [
      "Track unlimited companies",
      "Real-time notifications",
      "Advanced analytics & insights",
      "Custom notification settings",
      "Priority phone support",
      "Team collaboration features",
      "API access",
      "Custom reports"
    ],
    limitations: [],
    buttonText: "Upgrade to Premium",
    popular: false,
    plan: "premium"
  }
];

export default function Pricing() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string) => {
      if (!user) throw new Error("Must be logged in");
      return await apiRequest("POST", "/api/subscription/upgrade", { plan });
    },
    onSuccess: (data) => {
      if (data.requiresPayment) {
        // Redirect to payment page (would integrate with Stripe)
        window.location.href = data.paymentUrl;
      } else {
        toast({
          title: "Success",
          description: "Your plan has been updated successfully!",
        });
        setLocation("/dashboard");
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upgrade plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = (plan: string) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to upgrade your plan",
        variant: "destructive",
      });
      window.location.href = "/api/login";
      return;
    }
    
    setSelectedPlan(plan);
    upgradeMutation.mutate(plan);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pricing...</p>
        </div>
      </div>
    );
  }

  const currentPlan = user?.subscriptionPlan || "free";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get the layoff insights you need to stay ahead. Upgrade for enhanced tracking, 
            real-time notifications, and comprehensive analytics.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative hover-lift ${
                plan.popular 
                  ? 'ring-2 ring-primary shadow-lg scale-105' 
                  : 'hover:shadow-md'
              } ${currentPlan === plan.plan ? 'ring-2 ring-success' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  <Crown className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              {currentPlan === plan.plan && (
                <Badge className="absolute -top-3 right-4 bg-success text-success-foreground">
                  Current Plan
                </Badge>
              )}

              <CardHeader className="text-center pb-8">
                <div className="mb-4">
                  {plan.name === "Free" && <Building2 className="w-12 h-12 mx-auto text-muted-foreground" />}
                  {plan.name === "Pro" && <Zap className="w-12 h-12 mx-auto text-primary" />}
                  {plan.name === "Premium" && <Crown className="w-12 h-12 mx-auto text-warning" />}
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Included:</h4>
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-muted-foreground">Not included:</h4>
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{limitation}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Button */}
                <Button
                  className={`w-full mt-8 ${
                    plan.popular 
                      ? 'gradient-bg text-primary-foreground hover:opacity-90' 
                      : ''
                  }`}
                  variant={currentPlan === plan.plan ? "outline" : (plan.popular ? "default" : "outline")}
                  disabled={
                    currentPlan === plan.plan || 
                    upgradeMutation.isPending ||
                    (selectedPlan === plan.plan && upgradeMutation.isPending)
                  }
                  onClick={() => handleUpgrade(plan.plan)}
                >
                  {upgradeMutation.isPending && selectedPlan === plan.plan ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>Processing...</span>
                    </div>
                  ) : currentPlan === plan.plan ? (
                    "Current Plan"
                  ) : (
                    plan.buttonText
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-8">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Can I change my plan anytime?
              </h4>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                How do notifications work?
              </h4>
              <p className="text-muted-foreground">
                You'll receive instant notifications via email and SMS (Pro+) when layoffs are announced at your tracked companies.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Is my data secure?
              </h4>
              <p className="text-muted-foreground">
                Absolutely. We use enterprise-grade security and never share your personal information.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">
                Can I cancel anytime?
              </h4>
              <p className="text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll keep access until your billing period ends.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}