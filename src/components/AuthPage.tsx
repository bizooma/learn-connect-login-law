import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan');
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    // If a plan is selected, automatically switch to register tab
    if (selectedPlan) {
      setActiveTab("register");
    }
  }, [selectedPlan]);

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            <LoginForm />
          </TabsContent>
          
          <TabsContent value="register" className="mt-6">
            <RegisterForm selectedPlan={selectedPlan} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;
