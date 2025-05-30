
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PersonalInfoFields from "./PersonalInfoFields";
import PasswordFields from "./PasswordFields";
import UserTypeRadioGroup from "./UserTypeRadioGroup";
import LawFirmField from "./LawFirmField";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    lawFirmName: "",
    userType: "",
  });
  const [isLoading, setIsLoading] = useState(false);

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
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            law_firm_name: formData.lawFirmName,
            user_type: formData.userType,
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
          description: "Please check your email to confirm your account.",
        });
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
