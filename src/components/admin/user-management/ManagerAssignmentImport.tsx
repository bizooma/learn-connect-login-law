import { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Upload, Download, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type RowStatus =
  | "Ready"
  | "Staff not found"
  | "Manager not found"
  | "Ambiguous staff"
  | "Ambiguous manager"
  | "Self-assignment"
  | "Missing name"
  | "Updated"
  | "Failed";

interface PreviewRow {
  rowNumber: number;
  staffName: string;
  managerName: string;
  staffId: string | null;
  managerId: string | null;
  resolvedStaff: string | null;
  resolvedManager: string | null;
  status: RowStatus;
  error?: string;
}

interface ProfileLite {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

const splitName = (full: string): { first: string; last: string } => {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  const last = parts.pop() as string;
  return { first: parts.join(" "), last };
};

const ManagerAssignmentImport = () => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [summary, setSummary] = useState<{ updated: number; skipped: number } | null>(null);

  const readyCount = useMemo(() => rows.filter(r => r.status === "Ready").length, [rows]);

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setSummary(null);
    setRows([]);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (raw.length === 0) {
        toast({ title: "Empty file", description: "No rows found in the sheet.", variant: "destructive" });
        return;
      }

      // Find columns case-insensitively
      const headers = Object.keys(raw[0]);
      const staffCol = headers.find(h => normalize(h) === "staff_name" || normalize(h) === "staff name");
      const managerCol = headers.find(h => normalize(h) === "manager_name" || normalize(h) === "manager name");
      if (!staffCol || !managerCol) {
        toast({
          title: "Missing columns",
          description: "File must have 'staff_name' and 'manager_name' columns.",
          variant: "destructive",
        });
        return;
      }

      // Fetch profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("is_deleted", false);
      if (error) throw error;

      const byName = new Map<string, ProfileLite[]>();
      (profiles ?? []).forEach(p => {
        const key = normalize(`${p.first_name ?? ""} ${p.last_name ?? ""}`);
        if (!key.trim()) return;
        const arr = byName.get(key) ?? [];
        arr.push(p as ProfileLite);
        byName.set(key, arr);
      });

      const resolve = (name: string): { id: string | null; display: string | null; status: "ok" | "missing" | "ambiguous" } => {
        const clean = name.trim();
        if (!clean) return { id: null, display: null, status: "missing" };
        const { first, last } = splitName(clean);
        const key = normalize(`${first} ${last}`);
        const matches = byName.get(key) ?? [];
        if (matches.length === 0) return { id: null, display: null, status: "missing" };
        if (matches.length > 1) return { id: null, display: null, status: "ambiguous" };
        const m = matches[0];
        return {
          id: m.id,
          display: `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || m.email,
          status: "ok",
        };
      };

      const preview: PreviewRow[] = raw.map((r, idx) => {
        const staffName = String(r[staffCol] ?? "").trim();
        const managerName = String(r[managerCol] ?? "").trim();
        const base = { rowNumber: idx + 2, staffName, managerName };
        if (!staffName || !managerName) {
          return { ...base, staffId: null, managerId: null, resolvedStaff: null, resolvedManager: null, status: "Missing name" };
        }
        const s = resolve(staffName);
        const m = resolve(managerName);
        let status: RowStatus = "Ready";
        if (s.status === "missing") status = "Staff not found";
        else if (s.status === "ambiguous") status = "Ambiguous staff";
        else if (m.status === "missing") status = "Manager not found";
        else if (m.status === "ambiguous") status = "Ambiguous manager";
        else if (s.id && m.id && s.id === m.id) status = "Self-assignment";
        return {
          ...base,
          staffId: s.id,
          managerId: m.id,
          resolvedStaff: s.display,
          resolvedManager: m.display,
          status,
        };
      });

      setRows(preview);
    } catch (err) {
      console.error(err);
      toast({
        title: "Parse error",
        description: err instanceof Error ? err.message : "Failed to read file",
        variant: "destructive",
      });
    } finally {
      setParsing(false);
      resetInput();
    }
  };

  const handleApply = async () => {
    setApplying(true);
    const updatedRows = [...rows];
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < updatedRows.length; i++) {
      const r = updatedRows[i];
      if (r.status !== "Ready" || !r.staffId || !r.managerId) {
        if (r.status !== "Ready") skipped++;
        continue;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ manager_id: r.managerId })
        .eq("id", r.staffId);
      if (error) {
        updatedRows[i] = { ...r, status: "Failed", error: error.message };
        skipped++;
      } else {
        updatedRows[i] = { ...r, status: "Updated" };
        updated++;
      }
    }

    setRows(updatedRows);
    setSummary({ updated, skipped });
    setApplying(false);
    toast({
      title: "Import complete",
      description: `${updated} updated, ${skipped} skipped`,
    });
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["staff_name", "manager_name"],
      ["Jane Doe", "John Smith"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assignments");
    XLSX.writeFile(wb, "manager-assignments-template.xlsx");
  };

  const downloadSkipped = () => {
    const skipped = rows.filter(r => r.status !== "Updated" && r.status !== "Ready");
    if (skipped.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(
      skipped.map(r => ({
        row: r.rowNumber,
        staff_name: r.staffName,
        manager_name: r.managerName,
        status: r.status,
        error: r.error ?? "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Skipped");
    XLSX.writeFile(wb, "manager-assignments-skipped.xlsx");
  };

  const statusVariant = (s: RowStatus): "default" | "secondary" | "destructive" | "outline" => {
    if (s === "Ready" || s === "Updated") return "default";
    if (s === "Failed") return "destructive";
    return "secondary";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Assign Managers from Spreadsheet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Upload a CSV or Excel file with two columns: <code>staff_name</code> and <code>manager_name</code>.</p>
          <p>Names must match a user's first + last name exactly (case-insensitive). Rows that can't be matched will be skipped.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadTemplate} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download template
          </Button>
        </div>

        <div>
          <Input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFile}
            disabled={parsing || applying}
            className="cursor-pointer"
          />
        </div>

        {parsing && (
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Parsing file and matching names...
          </div>
        )}

        {rows.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{rows.length}</span> rows &middot;{" "}
                <span className="text-green-600 font-medium">{readyCount}</span> ready to apply
              </div>
              <div className="flex gap-2">
                {summary && (
                  <Button variant="outline" size="sm" onClick={downloadSkipped}>
                    <Download className="h-4 w-4 mr-2" />
                    Download skipped
                  </Button>
                )}
                <Button
                  onClick={handleApply}
                  disabled={applying || readyCount === 0}
                  size="sm"
                >
                  {applying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Apply {readyCount} assignments
                    </>
                  )}
                </Button>
              </div>
            </div>

            {summary && (
              <div className="text-sm p-3 bg-muted rounded-md">
                Complete: <strong>{summary.updated}</strong> updated,{" "}
                <strong>{summary.skipped}</strong> skipped.
              </div>
            )}

            <div className="border rounded-md max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Staff (file)</TableHead>
                    <TableHead>Manager (file)</TableHead>
                    <TableHead>Resolved staff</TableHead>
                    <TableHead>Resolved manager</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(r => (
                    <TableRow key={r.rowNumber}>
                      <TableCell>{r.rowNumber}</TableCell>
                      <TableCell>{r.staffName || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{r.managerName || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{r.resolvedStaff || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{r.resolvedManager || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                        {r.error && <div className="text-xs text-destructive mt-1">{r.error}</div>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ManagerAssignmentImport;
