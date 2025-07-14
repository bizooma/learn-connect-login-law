
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PersonalInfoFields from "./PersonalInfoFields";
import PasswordFields from "./PasswordFields";
import UserTypeRadioGroup from "./UserTypeRadioGroup";
import LawFirmField from "./LawFirmField";

interface RegisterFormProps {
  selectedPlan?: string | null;
}

const RegisterForm = ({ selectedPlan }: RegisterFormProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    lawFirmName: "",
    userType: "",
    selectedPlan: selectedPlan || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [planDetails, setPlanDetails] = useState<any>(null);

  // Fetch plan details if a plan is selected
  useEffect(() => {
    if (selectedPlan) {
      fetchPlanDetails(selectedPlan);
    }
  }, [selectedPlan]);

  const fetchPlanDetails = async (planId: string) => {
    try {
      const planMapping: Record<string, string> = {
        'starter': 'Starter Package',
        'law-firms': 'Law Firms',
        'enterprise': 'Enterprise'
      };
      
      const planName = planMapping[planId];
      if (!planName) return;

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', planName)
        .single();

      if (error) {
        console.error('Error fetching plan:', error);
      } else {
        setPlanDetails(data);
      }
    } catch (error) {
      console.error('Error fetching plan details:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUserTypeChange = (value: string) => {
    setFormData({
      ...formData,
      userType: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            law_firm_name: formData.lawFirmName,
            user_type: formData.userType,
            selected_plan: formData.selectedPlan,
          },
        },
      });

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Successful",
          description: "Account created successfully! Redirecting to payment...",
        });

        // If a plan was selected and user is created, immediately redirect to payment
        if (selectedPlan && authData.user) {
          // Small delay to ensure auth is settled, then create checkout
          setTimeout(async () => {
            try {
              const { data, error: checkoutError } = await supabase.functions.invoke('create-subscription-checkout', {
                body: { planId: selectedPlan },
              });

              if (checkoutError) {
                console.error('Checkout error:', checkoutError);
                toast({
                  title: "Checkout Error",
                  description: "Failed to create checkout session. Please try again.",
                  variant: "destructive",
                });
              } else if (data?.url) {
                window.location.href = data.url;
              }
            } catch (checkoutError) {
              console.error('Unexpected checkout error:', checkoutError);
              toast({
                title: "Error",
                description: "Please try selecting your plan again.",
                variant: "destructive",
              });
            }
          }, 1000);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {planDetails && (
        <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
          <h3 className="font-semibold text-blue-800">Selected Plan: {planDetails.name}</h3>
          <p className="text-sm text-blue-600">${(planDetails.price_cents / 100).toFixed(0)}/month • Up to {planDetails.max_users} users</p>
        </div>
      )}
      
      <PersonalInfoFields
        firstName={formData.firstName}
        lastName={formData.lastName}
        email={formData.email}
        onChange={handleChange}
      />

      <PasswordFields
        password={formData.password}
        confirmPassword={formData.confirmPassword}
        onPasswordChange={handleChange}
        onConfirmPasswordChange={handleChange}
      />

      <UserTypeRadioGroup
        value={formData.userType}
        onChange={handleUserTypeChange}
      />

      <LawFirmField
        value={formData.lawFirmName}
        onChange={handleChange}
      />

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>

      <p className="text-xs text-gray-600 text-center mt-4">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
};

export default RegisterForm;
