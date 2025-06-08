
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, Eye, Calendar, User, UserCog, UserX, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AuditEntry {
  id: string;
  target_user_id: string;
  target_email: string;
  action_type: string;
  performed_by: string;
  performer_email: string;
  performed_at: string;
  reason: string;
  old_data: any;
  new_data: any;
  is_reversible: boolean;
}

const UserAuditTab = () => {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const { toast } = useToast();

  const fetchAuditEntries = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_user_management_history', {
        p_user_id: null,
        p_limit: 100
      });

      if (error) throw error;

      setAuditEntries(data || []);
    } catch (error: any) {
      console.error('Error fetching audit entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch audit history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEntries();
  }, []);

  const filteredEntries = auditEntries.filter(entry => {
    const matchesSearch = 
      entry.target_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.performer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = actionFilter === "all" || entry.action_type === actionFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'soft_delete':
        return <UserX className="h-4 w-4 text-orange-600" />;
      case 'restore':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'role_change':
        return <UserCog className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'soft_delete':
        return 'bg-orange-100 text-orange-800';
      case 'restore':
        return 'bg-green-100 text-green-800';
      case 'role_change':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActionType = (actionType: string) => {
    switch (actionType) {
      case 'soft_delete':
        return 'User Deactivated';
      case 'restore':
        return 'User Restored';
      case 'role_change':
        return 'Role Changed';
      default:
        return actionType;
    }
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
          <h3 className="text-lg font-semibold text-gray-900">User Management Audit Log</h3>
          <p className="text-sm text-gray-600">
            Complete history of user management actions with full traceability
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAuditEntries}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by email, performer, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="soft_delete">User Deactivated</SelectItem>
            <SelectItem value="restore">User Restored</SelectItem>
            <SelectItem value="role_change">Role Changed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Audit Entries</h3>
            <p className="text-gray-500">
              {searchTerm || actionFilter !== "all" 
                ? "No audit entries match your filters." 
                : "No user management actions have been recorded yet."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getActionIcon(entry.action_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getActionBadgeColor(entry.action_type)}>
                          {formatActionType(entry.action_type)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(entry.performed_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Target:</span> {entry.target_email}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Performed by:</span> {entry.performer_email}
                        </p>
                        {entry.reason && (
                          <p className="text-sm">
                            <span className="font-medium">Reason:</span> {entry.reason}
                          </p>
                        )}
                        
                        {entry.action_type === 'role_change' && entry.old_data && entry.new_data && (
                          <p className="text-sm">
                            <span className="font-medium">Role change:</span> {entry.old_data.role} → {entry.new_data.role}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {format(new Date(entry.performed_at), 'HH:mm:ss')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserAuditTab;
