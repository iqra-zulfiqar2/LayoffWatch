import { useState, useEffect } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ type }: { type: 'trial' | 'subscription' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: type === 'trial' 
            ? "Your trial has started! Payment method saved for after trial."
            : "Welcome to Layoff Proof Pro!",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {type === 'trial' ? 'Start Free Trial' : 'Subscribe Now'}
          </>
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [subscriptionType, setSubscriptionType] = useState<'trial' | 'subscription'>('trial');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Start trial by default - creates setup intent to save payment method
    const startTrial = async () => {
      try {
        const response = await apiRequest("POST", "/api/stripe/start-trial");
        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setSubscriptionType('trial');
        } else {
          throw new Error("No client secret received");
        }
      } catch (error) {
        console.error("Error starting trial:", error);
        toast({
          title: "Setup Error",
          description: "Failed to initialize payment setup. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    startTrial();
  }, [toast]);

  const switchToSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/stripe/create-payment-intent", { amount: 19 });
      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setSubscriptionType('subscription');
      }
    } catch (error) {
      console.error("Error creating payment intent:", error);
      toast({
        title: "Setup Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
              <p className="mt-4 text-gray-600 dark:text-gray-300">Setting up your payment...</p>
            </div>
          </div>
        </div>
        <GlobalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {subscriptionType === 'trial' ? 'Start Your Free Trial' : 'Subscribe to Layoff Proof Pro'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {subscriptionType === 'trial' 
                ? 'Save your payment method to continue after your 7-day free trial ends.'
                : 'Get immediate access to all premium features for $19/month.'
              }
            </p>
          </div>

          {/* Pricing Card */}
          <Card className="mb-6 border-blue-500 ring-2 ring-blue-500 shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Badge className="bg-blue-600 text-white">
                  {subscriptionType === 'trial' ? '7-Day Free Trial' : 'Monthly Plan'}
                </Badge>
              </div>
              <CardTitle className="text-2xl">Layoff Proof Pro</CardTitle>
              <div className="text-3xl font-bold text-blue-600">
                {subscriptionType === 'trial' ? 'Free for 7 days' : '$19/month'}
              </div>
              <CardDescription>
                {subscriptionType === 'trial' 
                  ? 'Then $19/month. Cancel anytime during trial.'
                  : 'Full access to all premium features'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2 mb-6">
                {[
                  "AI-powered Resume Builder with 4 templates",
                  "Unlimited resume downloads",
                  "Smart Cover Letter Generator", 
                  "AI Interview Preparation",
                  "LinkedIn Profile Optimizer",
                  "Real-time Layoff Tracker",
                  "Priority support"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Payment Type Toggle */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Option:
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={switchToSubscription}
                    disabled={isLoading}
                  >
                    {subscriptionType === 'trial' ? 'Skip Trial - Pay Now' : 'Start Free Trial'}
                  </Button>
                </div>
              </div>

              {/* Stripe Payment Form */}
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm type={subscriptionType} />
              </Elements>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>🔒 Secured by Stripe. Your payment information is encrypted and secure.</p>
            <p className="mt-1">You can cancel anytime from your account settings.</p>
          </div>
        </div>
      </div>
      
      <GlobalFooter />
    </div>
  );
}