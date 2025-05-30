
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/6f8c1259-11b1-4be9-a417-70350b17ddad.png" 
            alt="New Frontier University"
            className="mx-auto mb-4 h-20 w-auto"
          />
          <h1 className="text-3xl font-bold text-gray-900">Learning Management System</h1>
          <p className="text-gray-600 mt-2">Access your legal education platform</p>
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
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuthPage;
