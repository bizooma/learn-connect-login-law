import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Users, Shield, Zap } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Clear any pending plan data from localStorage
    localStorage.removeItem('pendingPlanId');
    localStorage.removeItem('pendingUserEmail');
    
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Welcome to New Frontier University! Your subscription has been activated and you now have full access to our immigration law training platform.
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-3 text-left">
            <Users className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">Access to all training courses</span>
          </div>
          <div className="flex items-center space-x-3 text-left">
            <Shield className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">Monthly live coaching sessions</span>
          </div>
          <div className="flex items-center space-x-3 text-left">
            <Zap className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">Priority support access</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link to="/" className="block">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          
          <p className="text-xs text-gray-500">
            Session ID: {sessionId?.slice(-8) || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;