
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Award, Star } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Achievement = Tables<'achievements'>;

interface AchievementsBadgeProps {
  achievement: Achievement;
  earned: boolean;
  earnedAt?: string;
}

const AchievementsBadge = ({ achievement, earned, earnedAt }: AchievementsBadgeProps) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'trophy':
        return <Trophy className="h-6 w-6" />;
      case 'award':
        return <Award className="h-6 w-6" />;
      case 'star':
        return <Star className="h-6 w-6" />;
      default:
        return <Badge className="h-6 w-6" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 border-gray-300';
      case 'uncommon':
        return 'bg-green-100 border-green-300';
      case 'rare':
        return 'bg-blue-100 border-blue-300';
      case 'epic':
        return 'bg-purple-100 border-purple-300';
      case 'legendary':
        return 'bg-yellow-100 border-yellow-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <Card className={`${earned ? getRarityColor(achievement.rarity) : 'bg-gray-50 border-gray-200 opacity-60'} transition-all hover:scale-105`}>
      <CardContent className="p-4 text-center">
        <div 
          className={`mx-auto mb-2 p-2 rounded-full w-fit`}
          style={{ color: earned ? achievement.badge_color : '#9CA3AF' }}
        >
          {getIcon(achievement.badge_icon)}
        </div>
        <h3 className={`font-semibold text-sm ${earned ? 'text-gray-900' : 'text-gray-500'}`}>
          {achievement.name}
        </h3>
        <p className={`text-xs mt-1 ${earned ? 'text-gray-600' : 'text-gray-400'}`}>
          {achievement.description}
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Badge 
            variant="outline" 
            className={`text-xs ${earned ? '' : 'opacity-50'}`}
            style={{ 
              borderColor: earned ? achievement.badge_color : '#9CA3AF',
              color: earned ? achievement.badge_color : '#9CA3AF'
            }}
          >
            {achievement.rarity}
          </Badge>
        </div>
        {earned && earnedAt && (
          <p className="text-xs text-gray-500 mt-1">
            Earned {new Date(earnedAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementsBadge;
