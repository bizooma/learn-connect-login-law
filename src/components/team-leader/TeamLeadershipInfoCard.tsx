
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TeamLeadershipInfoCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Leadership</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          As a Team Leader, you can monitor your team members' progress, 
          view their course completions, and help guide their learning journey.
        </p>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-500">• View team member progress</p>
          <p className="text-sm text-gray-500">• Monitor course completions</p>
          <p className="text-sm text-gray-500">• Access learning analytics</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamLeadershipInfoCard;
