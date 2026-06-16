import { MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DirectoryUser } from "@/hooks/useDirectoryUsers";

interface Props {
  users: DirectoryUser[];
  onSelect?: (user: DirectoryUser) => void;
}

const initials = (u: DirectoryUser) => {
  const f = (u.first_name?.[0] ?? "").toUpperCase();
  const l = (u.last_name?.[0] ?? "").toUpperCase();
  return (f + l) || (u.email?.[0]?.toUpperCase() ?? "?");
};

const fullName = (u: DirectoryUser) =>
  [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email;

const DirectoryTable = ({ users }: Props) => {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Job Title</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {u.profile_image_url && (
                      <AvatarImage src={u.profile_image_url} alt={fullName(u)} />
                    )}
                    <AvatarFallback className="text-xs">
                      {initials(u)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">{fullName(u)}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                  Active
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {u.job_title || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DirectoryTable;
