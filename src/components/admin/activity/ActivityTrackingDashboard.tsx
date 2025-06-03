
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Users, Clock, TrendingUp, Search, Filter, Download } from "lucide-react";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  course_id?: string;
  unit_id?: string;
  quiz_id?: string;
  session_id?: string;
  duration_seconds?: number;
  metadata?: any;
  created_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
  courses?: {
    title: string;
  };
  units?: {
    title: string;
  };
}

interface ActivityStats {
  totalActivities: number;
  activeUsers: number;
  avgSessionDuration: number;
  topActivity: string;
}

const ActivityTrackingDashboard = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats>({
    totalActivities: 0,
    activeUsers: 0,
    avgSessionDuration: 0,
    topActivity: ''
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");

  useEffect(() => {
    fetchActivityData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('activity-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity_log'
        },
        () => {
          fetchActivityData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateFilter, activityFilter]);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      let dateCondition = "";
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          dateCondition = `created_at >= '${format(now, 'yyyy-MM-dd')}'`;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateCondition = `created_at >= '${format(weekAgo, 'yyyy-MM-dd')}'`;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateCondition = `created_at >= '${format(monthAgo, 'yyyy-MM-dd')}'`;
          break;
        default:
          dateCondition = "true";
      }

      // Build query
      let query = supabase
        .from('user_activity_log')
        .select(`
          *,
          profiles:user_id (first_name, last_name, email),
          courses:course_id (title),
          units:unit_id (title)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (activityFilter !== 'all') {
        query = query.eq('activity_type', activityFilter);
      }

      const { data: activityData, error } = await query;

      if (error) throw error;

      // Filter by search term
      const filteredData = activityData?.filter(activity => {
        const searchLower = searchTerm.toLowerCase();
        return (
          activity.profiles?.email?.toLowerCase().includes(searchLower) ||
          activity.profiles?.first_name?.toLowerCase().includes(searchLower) ||
          activity.profiles?.last_name?.toLowerCase().includes(searchLower) ||
          activity.courses?.title?.toLowerCase().includes(searchLower) ||
          activity.activity_type.toLowerCase().includes(searchLower)
        );
      }) || [];

      setActivities(filteredData);

      // Calculate stats
      const totalActivities = filteredData.length;
      const activeUsers = new Set(filteredData.map(a => a.user_id)).size;
      const totalDuration = filteredData
        .filter(a => a.duration_seconds)
        .reduce((sum, a) => sum + (a.duration_seconds || 0), 0);
      const avgSessionDuration = totalDuration / Math.max(1, filteredData.filter(a => a.duration_seconds).length);
      
      // Find most common activity
      const activityCounts = filteredData.reduce((acc, activity) => {
        acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topActivity = Object.entries(activityCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

      setStats({
        totalActivities,
        activeUsers,
        avgSessionDuration: Math.round(avgSessionDuration),
        topActivity
      });

    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityBadge = (activityType: string) => {
    const colors = {
      login: 'bg-green-100 text-green-800',
      logout: 'bg-gray-100 text-gray-800',
      course_access: 'bg-blue-100 text-blue-800',
      unit_access: 'bg-purple-100 text-purple-800',
      unit_complete: 'bg-emerald-100 text-emerald-800',
      quiz_start: 'bg-orange-100 text-orange-800',
      quiz_complete: 'bg-yellow-100 text-yellow-800',
      video_play: 'bg-pink-100 text-pink-800',
      video_pause: 'bg-indigo-100 text-indigo-800',
      video_complete: 'bg-teal-100 text-teal-800',
      page_view: 'bg-slate-100 text-slate-800'
    };

    return (
      <Badge className={colors[activityType as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {activityType.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Activity Tracking</h2>
          <p className="text-gray-600">Monitor real-time user engagement and learning patterns</p>
        </div>
        <Button variant="outline" onClick={fetchActivityData}>
          <Download className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.avgSessionDuration)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold capitalize">
              {stats.topActivity.replace('_', ' ')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by user, course, or activity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="course_access">Course Access</SelectItem>
                <SelectItem value="unit_complete">Unit Complete</SelectItem>
                <SelectItem value="quiz_complete">Quiz Complete</SelectItem>
                <SelectItem value="video_complete">Video Complete</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Course/Content</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {activity.profiles?.first_name && activity.profiles?.last_name
                          ? `${activity.profiles.first_name} ${activity.profiles.last_name}`
                          : 'Unknown User'
                        }
                      </div>
                      <div className="text-sm text-gray-500">{activity.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getActivityBadge(activity.activity_type)}</TableCell>
                  <TableCell>
                    {activity.courses?.title || activity.units?.title || '-'}
                  </TableCell>
                  <TableCell>{formatDuration(activity.duration_seconds)}</TableCell>
                  <TableCell>{format(new Date(activity.created_at), 'MMM d, HH:mm')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityTrackingDashboard;
