
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SimpleRegistrationForm from "@/components/SimpleRegistrationForm";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If user is already logged in, redirect them to appropriate dashboard
  useEffect(() => {
    if (user) {
      navigate("/free-dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#213C82' }}>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
            alt="New Frontier University" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
          <p className="text-gray-600 mt-2">Join New Frontier University and start your learning journey</p>
        </div>

        <SimpleRegistrationForm />

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
