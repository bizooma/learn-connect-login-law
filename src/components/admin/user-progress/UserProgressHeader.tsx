
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { User } from "lucide-react";

interface UserProgressHeaderProps {
  userName: string;
  userEmail: string;
  onClose: () => void;
}

const UserProgressHeader = ({ userName, userEmail, onClose }: UserProgressHeaderProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{userName}</h3>
            <p className="text-gray-600">{userEmail}</p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};

export default UserProgressHeader;
