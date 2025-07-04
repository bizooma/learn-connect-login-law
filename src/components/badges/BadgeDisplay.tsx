import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Award } from "lucide-react";

interface Badge {
  id: string;
  badge_name: string;
  description: string;
  badge_image_url?: string;
  badge_color: string;
  earned_at: string;
}

interface BadgeDisplayProps {
  userId?: string;
  showAll?: boolean;
  className?: string;
}

const BadgeDisplay = ({ userId, showAll = false, className = "" }: BadgeDisplayProps) => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchUserBadges();
    }
  }, [targetUserId]);

  const fetchUserBadges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_achievements')
        .select('id, badge_name, description, badge_image_url, badge_color, earned_at')
        .eq('user_id', targetUserId)
        .eq('is_badge', true)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse w-6 h-6 bg-gray-300 rounded-full"></div>
        <div className="animate-pulse w-6 h-6 bg-gray-300 rounded-full"></div>
      </div>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  const displayBadges = showAll ? badges : badges.slice(0, 3);

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {displayBadges.map((badge) => (
        <div
          key={badge.id}
          className="relative group"
          title={`${badge.badge_name}: ${badge.description}`}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
            style={{ backgroundColor: badge.badge_color }}
          >
            {badge.badge_image_url ? (
              <img
                src={badge.badge_image_url}
                alt={badge.badge_name}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <Award className="h-3 w-3 text-white" />
            )}
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
            {badge.badge_name}
          </div>
        </div>
      ))}
      
      {!showAll && badges.length > 3 && (
        <span className="text-xs text-gray-500 ml-1">
          +{badges.length - 3}
        </span>
      )}
    </div>
  );
};

export default BadgeDisplay;