
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

const CalendarCleanup = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const cleanupAutomaticEvents = async () => {
    setLoading(true);
    
    try {
      // Delete all events that contain "Welcome to" in the title (automatic events)
      const { error } = await supabase
        .from('course_calendars')
        .delete()
        .ilike('title', '%Welcome to%');

      if (error) throw error;

      toast({
        title: "Success",
        description: "All automatic calendar events have been removed",
      });
    } catch (error) {
      console.error('Error cleaning up calendar events:', error);
      toast({
        title: "Error",
        description: "Failed to clean up calendar events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trash2 className="h-5 w-5 mr-2" />
          Calendar Cleanup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Remove all automatically generated "Welcome to Course" events from calendars. 
          Only manually created events will remain.
        </p>
        <Button 
          onClick={cleanupAutomaticEvents}
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          {loading ? "Cleaning up..." : "Remove Automatic Events"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CalendarCleanup;
