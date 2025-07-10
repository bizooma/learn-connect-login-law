import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Loader2 } from "lucide-react";

const CancelAccountSection = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCancelAccount = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-owner-account');
      
      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Account Cancelled",
          description: data.message,
        });
        
        // Force a page refresh to update the user's role/state
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to cancel account');
      }
    } catch (error) {
      console.error('Cancel account error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Cancel Account
        </CardTitle>
        <CardDescription>
          Permanently cancel your account and downgrade all employees to free accounts. 
          This will stop all billing and remove access to premium features.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Account'
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>This action will:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Cancel all active Stripe subscriptions</li>
                  <li>Downgrade your account from Owner to Free</li>
                  <li>Downgrade all employees from Student to Free</li>
                  <li>Remove access to premium features</li>
                  <li>Keep all data for potential future reactivation</li>
                </ul>
                <p className="font-semibold pt-2">
                  This action cannot be undone from this interface.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Yes, Cancel Account'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default CancelAccountSection;