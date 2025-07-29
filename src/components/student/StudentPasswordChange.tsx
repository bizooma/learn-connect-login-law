
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import PasswordFields from "@/components/PasswordFields";
import { useSecurePasswordChange } from "@/hooks/useSecurePasswordChange";

const StudentPasswordChange = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { changePassword, isLoading } = useSecurePasswordChange();

  const handlePasswordChange = async () => {
    const success = await changePassword(currentPassword, newPassword, confirmPassword);
    
    if (success) {
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleCurrentPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPassword(e.target.value);
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lock className="h-5 w-5" />
          <span>Change Password</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="current-password" className="text-sm font-medium">
            Current Password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={handleCurrentPasswordChange}
            placeholder="Enter your current password"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          />
        </div>

        <PasswordFields
          password={newPassword}
          confirmPassword={confirmPassword}
          onPasswordChange={handleNewPasswordChange}
          onConfirmPasswordChange={handleConfirmPasswordChange}
        />

        <Button 
          onClick={handlePasswordChange}
          disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
          className="w-full"
        >
          {isLoading ? "Updating..." : "Change Password"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default StudentPasswordChange;
