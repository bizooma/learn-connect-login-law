import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Trophy } from "lucide-react";

interface Badge {
  id: string;
  badge_name: string;
  description: string;
  badge_image_url?: string;
  badge_color: string;
  earned_at: string;
}

const StudentBadgesSection = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserBadges();
    }
  }, [user?.id]);

  const fetchUserBadges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_achievements')
        .select('id, badge_name, description, badge_image_url, badge_color, earned_at')
        .eq('user_id', user?.id)
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>My Badges</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-5 w-5" />
          <span>My Badges</span>
          {badges.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {badges.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No badges earned yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Complete courses to earn your first badge!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                  style={{ backgroundColor: badge.badge_color }}
                >
                  {badge.badge_image_url ? (
                    <img
                      src={badge.badge_image_url}
                      alt={badge.badge_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <Award className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-900 truncate">
                    {badge.badge_name}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {badge.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Earned {new Date(badge.earned_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentBadgesSection;