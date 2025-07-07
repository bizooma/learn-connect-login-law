
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { repairVideoCompletionData, repairLegalTraining200 } from "@/utils/videoCompletionRepair";
import { logger } from "@/utils/logger";

const VideoCompletionManager = () => {
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairResults, setRepairResults] = useState<any>(null);
  const [userIdFilter, setUserIdFilter] = useState("");
  const [courseIdFilter, setCourseIdFilter] = useState("");
  const { toast } = useToast();

  const handleRepairAll = async () => {
    setIsRepairing(true);
    try {
      const results = await repairVideoCompletionData(
        courseIdFilter || undefined,
        userIdFilter || undefined
      );
      
      setRepairResults(results);
      
      if (results.repairedVideos > 0) {
        toast({
          title: "Repair Completed! ✅",
          description: `Fixed ${results.repairedVideos} videos for ${results.repairedUsers} users.`,
        });
      } else {
        toast({
          title: "No Issues Found",
          description: "All video completion data appears to be consistent.",
        });
      }
      
      if (results.errors.length > 0) {
        logger.warn('Repair errors:', results.errors);
      }
    } catch (error) {
      toast({
        title: "Repair Failed",
        description: "Error occurred during repair process.",
        variant: "destructive",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  const handleRepairLegalTraining = async () => {
    setIsRepairing(true);
    try {
      const results = await repairLegalTraining200();
      
      setRepairResults(results);
      
      toast({
        title: "Legal Training-200 Repair Completed! ✅",
        description: `Fixed ${results.repairedVideos} videos for ${results.repairedUsers} users.`,
      });
      
      if (results.errors.length > 0) {
        logger.warn('Legal Training repair errors:', results.errors);
      }
    } catch (error) {
      toast({
        title: "Legal Training Repair Failed",
        description: "Error occurred during Legal Training-200 repair.",
        variant: "destructive",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>Video Completion Repair Tool</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">User ID Filter (Optional)</label>
              <Input
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                placeholder="Enter specific user ID"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Course ID Filter (Optional)</label>
              <Input
                value={courseIdFilter}
                onChange={(e) => setCourseIdFilter(e.target.value)}
                placeholder="Enter specific course ID"
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button
              onClick={handleRepairAll}
              disabled={isRepairing}
              className="flex-1"
            >
              {isRepairing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Repairing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Repair Video Completions
                </>
              )}
            </Button>
            
            <Button
              onClick={handleRepairLegalTraining}
              disabled={isRepairing}
              variant="outline"
            >
              {isRepairing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Repairing...
                </>
              ) : (
                'Fix Legal Training-200'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {repairResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Repair Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {repairResults.repairedUsers}
                </div>
                <div className="text-sm text-gray-600">Users Fixed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {repairResults.repairedVideos}
                </div>
                <div className="text-sm text-gray-600">Videos Fixed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {repairResults.errors.length}
                </div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>

            {repairResults.details.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Repair Details:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {repairResults.details.map((detail: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <span>User: {detail.userId.slice(0, 8)}... | Unit: {detail.unitId.slice(0, 8)}...</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant={detail.fixed ? "default" : "destructive"}>
                          {detail.fixed ? "Fixed" : "Failed"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {repairResults.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Errors:
                </h4>
                <div className="max-h-32 overflow-y-auto">
                  {repairResults.errors.map((error: string, index: number) => (
                    <div key={index} className="text-sm text-red-600 p-1">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoCompletionManager;
