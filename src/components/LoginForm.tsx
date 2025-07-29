
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ForgotPasswordDialog from "./ForgotPasswordDialog";
import { logger } from "@/utils/logger";
import { 
  isMobileDevice, 
  clearAuthStorage, 
  isRefreshTokenError, 
  isNetworkError,
  getMobileErrorMessage 
} from "@/utils/mobileAuthUtils";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const getDetailedErrorMessage = (error: any) => {
    logger.error('Login error details:', error);
    
    if (!error) return "An unexpected error occurred";
    
    // Handle specific Supabase auth errors
    switch (error.message) {
      case 'Invalid login credentials':
        return "Invalid email or password. Please check your credentials and try again.";
      case 'Email not confirmed':
        return "Please check your email and click the confirmation link before logging in.";
      case 'Too many requests':
        return "Too many login attempts. Please wait a few minutes before trying again.";
      case 'User not found':
        return "No account found with this email address. Please check your email or sign up for a new account.";
      case 'Signup not allowed for this instance':
        return "Account creation is currently disabled. Please contact support.";
      case 'Database connection error':
        return "Unable to connect to our servers. Please try again in a moment.";
      // Add mobile-specific error handling
      case 'refresh_token_not_found':
      case 'invalid_refresh_token':
        return "Your session has expired. Please log in again.";
      default:
        // Log unknown errors for debugging
        if (error.message?.includes('fetch')) {
          return "Network error. Please check your internet connection and try again.";
        }
        if (error.message?.includes('refresh_token')) {
          return "Your session has expired. Please log in again.";
        }
        return error.message || "Login failed. Please try again or contact support if the problem persists.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    logger.info('LoginForm: Starting login attempt', { email });

    try {
      // Clear auth storage if we're on mobile and this might be a refresh token issue
      if (isMobileDevice()) {
        logger.info('Mobile device detected, clearing potentially stale auth tokens');
        clearAuthStorage();
      }

      // Add retry logic for network issues and mobile-specific errors
      let retryCount = 0;
      const maxRetries = isMobileDevice() ? 3 : 2; // More retries on mobile
      let lastError = null;

      while (retryCount <= maxRetries) {
        try {
          logger.debug(`LoginForm: Login attempt ${retryCount + 1}`, { email, isMobile: isMobileDevice() });
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

          if (error) {
            lastError = error;
            logger.error(`LoginForm: Login attempt ${retryCount + 1} failed`, { error: error.message });
            
            // Handle refresh token errors specifically on mobile
            if (isRefreshTokenError(error)) {
              logger.info('Refresh token error detected, clearing auth storage');
              clearAuthStorage();
              
              // On mobile, always retry once after clearing storage
              if (isMobileDevice() && retryCount === 0) {
                retryCount++;
                logger.debug('Mobile refresh token error - retrying after storage clear');
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
            }
            
            // Don't retry for credential errors
            if (error.message === 'Invalid login credentials' || 
                error.message === 'Email not confirmed' ||
                error.message === 'User not found') {
              break;
            }
            
            // Retry for network/server errors (more aggressive on mobile)
            if (retryCount < maxRetries && 
                (isNetworkError(error) || 
                 error.message?.includes('timeout') ||
                 error.message?.includes('server'))) {
              retryCount++;
              logger.debug(`LoginForm: Retrying login (attempt ${retryCount + 1})`);
              const delay = isMobileDevice() ? 1500 * retryCount : 1000 * retryCount; // Longer delay on mobile
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            break;
          }

          // Success
          logger.info('LoginForm: Login successful', {
            hasUser: !!data.user,
            hasSession: !!data.session,
            userEmail: data.user?.email
          });

          toast({
            title: "Login Successful",
            description: "Welcome back to your learning platform!",
          });
          
          // Navigate to dashboard where role-based routing will handle the redirect
          logger.debug('LoginForm: Login successful, navigating to dashboard');
          navigate("/dashboard");
          return;

        } catch (networkError) {
          logger.error(`LoginForm: Network error on attempt ${retryCount + 1}`, { error: networkError });
          lastError = networkError;
          
          if (retryCount < maxRetries) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            continue;
          }
          break;
        }
      }

      // If we get here, all attempts failed
      const errorMessage = isMobileDevice() 
        ? getMobileErrorMessage(lastError)
        : getDetailedErrorMessage(lastError);
      logger.error('LoginForm: All login attempts failed', { error: lastError, isMobile: isMobileDevice() });
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });

    } catch (error) {
      logger.error('LoginForm: Unexpected error during login', { error });
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="your.email@lawfirm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            If you forgot your password, contact sales@newfrontieruniversity.com to have it reset.
          </p>
        </div>
      </form>

      <ForgotPasswordDialog 
        open={showForgotPassword} 
        onOpenChange={setShowForgotPassword} 
      />
    </>
  );
};

export default LoginForm;
