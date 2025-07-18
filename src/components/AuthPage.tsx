
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan');
  const [activeTab, setActiveTab] = useState("login");

  // TEMPORARY REMOVAL OF REGISTRATION - 2025-07-18
  // Registration functionality has been temporarily disabled while we work on implementing
  // a transactional registration system. All the registration code is preserved below.
  // 
  // TO RE-ENABLE REGISTRATION:
  // 1. Uncomment the useEffect below that handles plan selection
  // 2. Add "register" TabsTrigger back to the TabsList
  // 3. Uncomment the TabsContent for "register" 
  // 4. The RegisterForm component and all related functionality is still intact
  //
  // The transactional registration system will include:
  // - Immediate payment processing after registration
  // - Plan selection integration with Stripe checkout
  // - User role assignment based on selected plan
  // - Enhanced onboarding flow

  // COMMENTED OUT - This useEffect automatically switches to register tab when a plan is selected
  // Uncomment this when re-enabling registration
  /*
  useEffect(() => {
    // If a plan is selected, automatically switch to register tab
    if (selectedPlan) {
      setActiveTab("register");
    }
  }, [selectedPlan]);
  */

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#213C82' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/6f8c1259-11b1-4be9-a417-70350b17ddad.png" 
            alt="New Frontier University"
            className="mx-auto mb-6 h-32 w-auto"
          />
          <p className="text-gray-600 mt-2">Immigration Law Firm Training</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="login">Login</TabsTrigger>
            {/* TEMPORARILY REMOVED - Uncomment to re-enable registration */}
            {/* <TabsTrigger value="register">Register</TabsTrigger> */}
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            <LoginForm />
          </TabsContent>
          
          {/* TEMPORARILY REMOVED - Registration tab content */}
          {/* Uncomment this section to re-enable registration functionality */}
          {/*
          <TabsContent value="register" className="mt-6">
            <RegisterForm selectedPlan={selectedPlan} />
          </TabsContent>
          */}
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;
