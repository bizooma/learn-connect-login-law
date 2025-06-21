
import { Crown, Medal, Award } from "lucide-react";

interface LeaderboardCardProps {
  rank: number;
  name: string;
  email: string;
  primaryStat: {
    label: string;
    value: string;
    icon?: string;
  };
  secondaryStat: {
    label: string;
    value: string;
  };
  isTopThree?: boolean;
}

const LeaderboardCard = ({
  rank,
  name,
  email,
  primaryStat,
  secondaryStat,
  isTopThree = false
}: LeaderboardCardProps) => {
  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankStyle = () => {
    if (!isTopThree) return "";
    
    switch (rank) {
      case 1:
        return "border-l-4 border-yellow-500 bg-yellow-50";
      case 2:
        return "border-l-4 border-gray-400 bg-gray-50";
      case 3:
        return "border-l-4 border-amber-600 bg-amber-50";
      default:
        return "";
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow ${getRankStyle()}`}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
          {isTopThree ? getRankIcon() : rank}
        </div>
        
        <div className="flex-1">
          <div className="font-medium text-gray-900">{name}</div>
          <div className="text-sm text-gray-500">{email}</div>
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="text-right">
          <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
            {primaryStat.icon && <span>{primaryStat.icon}</span>}
            {primaryStat.value}
          </div>
          <div className="text-xs text-gray-500">{primaryStat.label}</div>
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium text-gray-700">{secondaryStat.value}</div>
          <div className="text-xs text-gray-500">{secondaryStat.label}</div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardCard;
