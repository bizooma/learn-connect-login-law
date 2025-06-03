
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

interface XPNotificationProps {
  points: number;
  description: string;
  show: boolean;
  onHide: () => void;
}

const XPNotification = ({ points, description, show, onHide }: XPNotificationProps) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5">
      <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-300" />
          <div>
            <p className="font-bold">+{points} XP</p>
            <p className="text-sm opacity-90">{description}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default XPNotification;
