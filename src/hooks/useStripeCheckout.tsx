import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useStripeCheckout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const createCheckoutSession = async (planId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { planId },
      });

      if (error) {
        console.error('Checkout error:', error);
        toast({
          title: "Checkout Error",
          description: error.message || "Failed to create checkout session. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
        return data.url;
      } else {
        toast({
          title: "Checkout Error",
          description: "No checkout URL received. Please try again.",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error('Unexpected checkout error:', error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckoutSession,
    isLoading,
  };
};