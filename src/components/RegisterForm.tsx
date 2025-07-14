
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft } from "lucide-react";
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
  const [currentStep, setCurrentStep] = useState(1);
  const [termsAgreed, setTermsAgreed] = useState(false);
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

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.password || !formData.confirmPassword || !formData.userType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termsAgreed) {
      toast({
        title: "Terms Required",
        description: "You must agree to the terms and conditions to proceed.",
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

  const termsAndConditions = `
TERMS AND CONDITIONS

1. ACCEPTANCE OF TERMS
By creating an account and using our services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.

2. DESCRIPTION OF SERVICE
Our platform provides legal education and training services, including access to online courses, materials, and certification programs.

3. USER ACCOUNTS
- You must provide accurate and complete information when creating your account
- You are responsible for maintaining the confidentiality of your account credentials
- You must notify us immediately of any unauthorized use of your account

4. ACCEPTABLE USE
You agree to use our services only for lawful purposes and in accordance with these terms. You will not:
- Upload or transmit any harmful, offensive, or inappropriate content
- Attempt to gain unauthorized access to our systems
- Use our services for any commercial purpose without authorization

5. INTELLECTUAL PROPERTY
All content, materials, and resources provided through our platform are protected by intellectual property laws and remain our property or the property of our licensors.

6. PAYMENT AND SUBSCRIPTIONS
- Subscription fees are billed in advance and are non-refundable
- We reserve the right to change our pricing with 30 days notice
- Your subscription will automatically renew unless cancelled

7. PRIVACY
Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.

8. LIMITATION OF LIABILITY
Our liability to you is limited to the maximum extent permitted by law. We are not liable for any indirect, incidental, or consequential damages.

9. TERMINATION
We may terminate or suspend your account at any time for violation of these terms or for any other reason at our sole discretion.

10. CHANGES TO TERMS
We reserve the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of the new terms.

11. GOVERNING LAW
These terms are governed by the laws of the jurisdiction in which our company is registered.

By checking the box below, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
`;

  if (currentStep === 1) {
    return (
      <div className="space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <span className="px-2 py-1 bg-primary text-primary-foreground rounded">1</span>
          <span>Registration Details</span>
          <span>→</span>
          <span className="px-2 py-1 bg-muted rounded">2</span>
          <span>Terms & Conditions</span>
        </div>

        {planDetails && (
          <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
            <h3 className="font-semibold text-blue-800">Selected Plan: {planDetails.name}</h3>
            <p className="text-sm text-blue-600">${(planDetails.price_cents / 100).toFixed(0)}/month • Up to {planDetails.max_users} users</p>
          </div>
        )}
        
        <form onSubmit={handleNextStep} className="space-y-4">
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

          <Button type="submit" className="w-full">
            Next Step
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <button 
          onClick={() => setCurrentStep(1)}
          className="px-2 py-1 bg-muted hover:bg-muted/80 rounded flex items-center space-x-1"
        >
          <ChevronLeft className="h-3 w-3" />
          <span>1</span>
        </button>
        <span>Registration Details</span>
        <span>→</span>
        <span className="px-2 py-1 bg-primary text-primary-foreground rounded">2</span>
        <span>Terms & Conditions</span>
      </div>

      {planDetails && (
        <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
          <h3 className="font-semibold text-blue-800">Selected Plan: {planDetails.name}</h3>
          <p className="text-sm text-blue-600">${(planDetails.price_cents / 100).toFixed(0)}/month • Up to {planDetails.max_users} users</p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Terms and Conditions</h3>
        
        <ScrollArea className="h-64 w-full border rounded-md p-4">
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
            {termsAndConditions}
          </pre>
        </ScrollArea>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={termsAgreed}
            onCheckedChange={(checked) => setTermsAgreed(checked as boolean)}
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I agree to the Terms and Conditions
          </label>
        </div>

        <form onSubmit={handleCreateAccount} className="space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!termsAgreed || isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
