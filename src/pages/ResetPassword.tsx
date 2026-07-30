
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isInvite, setIsInvite] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    let settled = false;
    let mounted = true;
    let graceTimer: ReturnType<typeof setTimeout> | undefined;

    const failWith = (description: string) => {
      if (!mounted || settled) return;
      settled = true;
      setFailure(description);
      toast({
        title: "Link no longer valid",
        description,
        variant: "destructive",
      });
    };

    const succeed = () => {
      if (!mounted || settled) return;
      settled = true;
      setFailure(null);
      setIsValidSession(true);
    };

    // Catch sessions that supabase-js resolves asynchronously from the URL fragment
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "SIGNED_IN" ||
          event === "PASSWORD_RECOVERY" ||
          event === "INITIAL_SESSION" ||
          event === "USER_UPDATED")
      ) {
        succeed();
      }
    });

    const validateResetSession = async () => {
      const hashParams = new URLSearchParams(
        window.location.hash.startsWith("#") ? window.location.hash.slice(1) : ""
      );

      const tokenHash = searchParams.get("token_hash") || hashParams.get("token_hash");
      const type = searchParams.get("type") || hashParams.get("type");
      const error = searchParams.get("error") || hashParams.get("error");
      const errorDescription =
        searchParams.get("error_description") || hashParams.get("error_description");

      const invite = type === "invite" || type === "signup";
      setIsInvite(invite);

      if (error) {
        console.error("ResetPassword: Error in URL:", error, errorDescription);
        failWith(
          invite
            ? "This invite link has expired. Ask your administrator to resend it."
            : errorDescription || "This password reset link is invalid or has expired."
        );
        return;
      }

      // Deterministic path: token_hash in the query/hash
      if (tokenHash && (type === "recovery" || invite)) {
        try {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: invite ? "invite" : "recovery",
          });

          if (verifyError || !data?.session) {
            console.error("ResetPassword: OTP verification failed:", verifyError);
            failWith(
              invite
                ? "This invite link has expired. Ask your administrator to resend it."
                : verifyError?.message || "This password reset link is invalid or has expired."
            );
            return;
          }

          succeed();
          return;
        } catch (err) {
          console.error("ResetPassword: Unexpected error during verification:", err);
          failWith("An unexpected error occurred while verifying your link.");
          return;
        }
      }

      // Fragment-token path: supabase-js parses the URL asynchronously.
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        succeed();
        return;
      }

      // Give the client a grace period to finish parsing before deciding.
      graceTimer = setTimeout(async () => {
        const { data: retry } = await supabase.auth.getSession();
        if (retry?.session) {
          succeed();
          return;
        }
        failWith(
          "We couldn't verify your link. Try clicking it again, or ask your administrator to resend it."
        );
      }, 3000);
    };

    validateResetSession();

    return () => {
      mounted = false;
      if (graceTimer) clearTimeout(graceTimer);
      sub.subscription.unsubscribe();
    };
  }, [searchParams, navigate, toast]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: isInvite ? "Welcome aboard" : "Password Updated",
          description: isInvite
            ? "Your password is set and you're signed in."
            : "Your password has been successfully updated.",
        });
        // The session from the link is already active, so land them signed in
        navigate("/", { replace: true });
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

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your invite…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isInvite
              ? "Welcome to New Frontier University — choose your password"
              : "Reset Your Password"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating Password..." : "Update Password"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/")}
                className="text-sm text-gray-600 hover:underline"
              >
                Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
