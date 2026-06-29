import { UserProfile } from "@/components/admin/user-management/types";

const csvCell = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

export interface ExportableUser extends UserProfile {
  lastLoginAt?: string | null;
  groupNames?: string[];
  isTester?: boolean;
}

export const exportUsersCsv = (users: ExportableUser[], filename = "users.csv") => {
  const header = [
    "First Name",
    "Last Name",
    "Email",
    "Role",
    "Tester",
    "Groups",
    "Law Firm",
    "Created",
    "Last Login",
    "Status",
  ];

  const rows = users.map((u) =>
    [
      u.first_name || "",
      u.last_name || "",
      u.email,
      u.roles?.[0] || "student",
      u.isTester ? "yes" : "no",
      (u.groupNames || []).join("; "),
      u.law_firm_name || "",
      u.created_at,
      u.lastLoginAt || "",
      u.is_deleted ? "inactive" : "active",
    ].map(csvCell).join(",")
  );

  const csv = [header.map(csvCell).join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
