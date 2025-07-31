import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, Search } from "lucide-react";

interface QuizCompletionFixProps {
  onClose?: () => void;
}

const QuizCompletionFix = ({ onClose }: QuizCompletionFixProps) => {
  const [userEmail, setUserEmail] = useState("");
  const [unitTitle, setUnitTitle] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [unitInfo, setUnitInfo] = useState<any>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!userEmail || !unitTitle || !courseTitle) {
      toast({
        title: "Missing Information",
        description: "Please provide user email, unit title, and course title",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Find user by email
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('email', userEmail.toLowerCase())
        .single();

      if (userError || !users) {
        toast({
          title: "User Not Found",
          description: `No user found with email: ${userEmail}`,
          variant: "destructive",
        });
        return;
      }

      // Find course and unit
      const { data: courses, error: courseError } = await supabase
        .from('courses')
        .select(`
          id, 
          title,
          lessons!inner(
            id,
            units!inner(
              id, 
              title
            )
          )
        `)
        .ilike('title', `%${courseTitle}%`)
        .single();

      if (courseError || !courses) {
        toast({
          title: "Course Not Found",
          description: `No course found matching: ${courseTitle}`,
          variant: "destructive",
        });
        return;
      }

      // Find the specific unit
      const allUnits = courses.lessons.flatMap(l => l.units);
      const unit = allUnits.find(u => 
        u.title.toLowerCase().includes(unitTitle.toLowerCase())
      );

      if (!unit) {
        toast({
          title: "Unit Not Found",
          description: `No unit found matching: ${unitTitle}`,
          variant: "destructive",
        });
        return;
      }

      setUserInfo(users);
      setUnitInfo({ ...unit, courseId: courses.id, courseTitle: courses.title });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "An error occurred while searching",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualComplete = async () => {
    if (!userInfo || !unitInfo || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please search for user/unit and provide a reason",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Call the admin function to mark unit complete
      const { data, error } = await supabase.rpc('admin_mark_unit_completed', {
        p_user_id: userInfo.id,
        p_unit_id: unitInfo.id,
        p_course_id: unitInfo.courseId,
        p_reason: reason
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Unit completion has been manually recorded for ${userInfo.email}`,
      });

      // Reset form
      setUserEmail("");
      setUnitTitle("");
      setCourseTitle("");
      setReason("");
      setUserInfo(null);
      setUnitInfo(null);

      if (onClose) {
        onClose();
      }

    } catch (error: any) {
      console.error('Manual completion error:', error);
      toast({
        title: "Failed to Complete Unit",
        description: error.message || "An error occurred while marking the unit complete",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <span>Manual Quiz Completion Fix</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Use this tool to manually mark quiz/unit completion for users experiencing completion issues.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="userEmail">User Email</Label>
            <Input
              id="userEmail"
              type="email"
              placeholder="sara.skorija@newfrontier.us"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="courseTitle">Course Title (partial match)</Label>
            <Input
              id="courseTitle"
              placeholder="Legal Training-100"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitTitle">Unit Title (partial match)</Label>
          <Input
            id="unitTitle"
            placeholder="Red Flag: Visa overstays"
            value={unitTitle}
            onChange={(e) => setUnitTitle(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleSearch} 
          disabled={isLoading || !userEmail || !unitTitle || !courseTitle}
          className="w-full"
        >
          <Search className="h-4 w-4 mr-2" />
          {isLoading ? "Searching..." : "Find User & Unit"}
        </Button>

        {userInfo && unitInfo && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-800">Found Match</span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>User:</strong> {userInfo.first_name} {userInfo.last_name} ({userInfo.email})</p>
                <p><strong>Course:</strong> {unitInfo.courseTitle}</p>
                <p><strong>Unit:</strong> {unitInfo.title}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {userInfo && unitInfo && (
          <>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Manual Completion</Label>
              <Textarea
                id="reason"
                placeholder="Quiz passed multiple times but unit completion failed due to..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleManualComplete}
              disabled={isLoading || !reason.trim()}
              className="w-full"
              variant="destructive"
            >
              {isLoading ? "Processing..." : "Manually Complete Unit"}
            </Button>
          </>
        )}

        {onClose && (
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizCompletionFix;