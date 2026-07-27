import { MoreVertical, User, Copy, Mail, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,

  TableRow,
} from "@/components/ui/table";
import { ResizableHead } from "@/components/admin/wiki/ResizableHead";
import { useResizableColumns } from "@/hooks/useResizableColumns";

import { DirectoryUser } from "@/hooks/useDirectoryUsers";
import PnpPermissionPicker from "@/components/admin/wiki/directory/PnpPermissionPicker";
import {
  PNP_LEVEL_OPTIONS,
  useSetWikiPermission,
} from "@/hooks/useWikiPermission";

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

const DirectoryTable = ({ users, onSelect }: Props) => {
  const { toast } = useToast();
  const setPerm = useSetWikiPermission();
  const cols = useResizableColumns({
    storageKey: "directory-cols-v3",
    defaults: [260, 100, 180, 140, 140, 150, 240, 60],
  });
  const formatRole = (r: string) =>
    r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <ResizableHead width={cols.widths[0]} onResize={cols.onMouseDown(0)}>Name</ResizableHead>
            <ResizableHead width={cols.widths[1]} onResize={cols.onMouseDown(1)}>Status</ResizableHead>
            <ResizableHead width={cols.widths[2]} onResize={cols.onMouseDown(2)}>Job Title</ResizableHead>
            <ResizableHead width={cols.widths[3]} onResize={cols.onMouseDown(3)}>Role</ResizableHead>
            <ResizableHead width={cols.widths[4]} onResize={cols.onMouseDown(4)}>P&amp;P Access</ResizableHead>
            <ResizableHead width={cols.widths[5]} onResize={cols.onMouseDown(5)}>Department</ResizableHead>
            <ResizableHead width={cols.widths[6]} onResize={cols.onMouseDown(6)}>Email</ResizableHead>
            <ResizableHead width={cols.widths[7]} />
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((u) => (
            <TableRow
              key={u.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelect?.(u)}
            >
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
              <TableCell>
                {u.roles.length ? (
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <Badge key={r} variant="outline" className="text-xs">
                        {formatRole(r)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <PnpPermissionPicker
                  userId={u.id}
                  level={u.pnp_level}
                  locked={u.pnp_level_locked}
                />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {u.department || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>

              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => onSelect?.(u)}>
                      <User className="h-4 w-4 mr-2" /> View profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText(u.email);
                        toast({ title: "Email copied", description: u.email });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" /> Copy email
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        window.location.href = `mailto:${u.email}`;
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" /> Send email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger disabled={u.pnp_level_locked}>
                        <Shield className="h-4 w-4 mr-2" />
                        Set P&amp;P permission
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                          {u.pnp_level_locked
                            ? "Inherited from LMS role"
                            : "Permission level"}
                        </DropdownMenuLabel>
                        {PNP_LEVEL_OPTIONS.map((opt) => (
                          <DropdownMenuItem
                            key={opt.value}
                            className="items-start gap-2 py-2"
                            disabled={u.pnp_level_locked}
                            onSelect={() => {
                              if (!u.pnp_level_locked && opt.value !== u.pnp_level) {
                                setPerm.mutate({ userId: u.id, level: opt.value });
                              }
                            }}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{opt.label}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {opt.description}
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DirectoryTable;
