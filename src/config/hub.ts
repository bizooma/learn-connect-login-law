import {
  Scale,
  Users,
  Briefcase,
  Megaphone,
  HeartHandshake,
  GraduationCap,
  BookOpen,
  FileText,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export type TileTarget =
  | { kind: "path"; to: string }
  | { kind: "external"; url: string };

export interface Tile {
  label: string;
  description?: string;
  icon: LucideIcon;
  target: TileTarget;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tiles: Tile[];
}

/**
 * Placeholder department + tile config for the /hub prototype.
 * Replace with the real department list and target links when ready.
 */
export const departments: Department[] = [
  {
    id: "intake",
    name: "Intake",
    description: "Client onboarding, consultations, and case openings.",
    icon: HeartHandshake,
    tiles: [
      {
        label: "Intake Training",
        description: "LMS courses for the intake team.",
        icon: BookOpen,
        target: { kind: "path", to: "/courses" },
      },
      {
        label: "Intake Policies",
        description: "Policies & procedures for intake workflows.",
        icon: FileText,
        target: { kind: "path", to: "/admin/wiki" },
      },
      {
        label: "My Dashboard",
        icon: LayoutDashboard,
        target: { kind: "path", to: "/student-dashboard" },
      },
    ],
  },
  {
    id: "case-managers",
    name: "Case Managers",
    description: "Case processing, filings, and client communications.",
    icon: Briefcase,
    tiles: [
      {
        label: "Case Manager Training",
        icon: BookOpen,
        target: { kind: "path", to: "/courses" },
      },
      {
        label: "Case Handling Policies",
        icon: FileText,
        target: { kind: "path", to: "/admin/wiki" },
      },
    ],
  },
  {
    id: "attorneys",
    name: "Attorneys",
    description: "Legal strategy, hearings, and case review.",
    icon: Scale,
    tiles: [
      {
        label: "Attorney Training",
        icon: BookOpen,
        target: { kind: "path", to: "/courses" },
      },
      {
        label: "Legal P&P",
        icon: FileText,
        target: { kind: "path", to: "/admin/wiki" },
      },
    ],
  },
  {
    id: "admin-hr",
    name: "Admin / HR",
    description: "People operations, hiring, and internal administration.",
    icon: Users,
    tiles: [
      {
        label: "HR Training",
        icon: GraduationCap,
        target: { kind: "path", to: "/courses" },
      },
      {
        label: "HR Policies",
        icon: FileText,
        target: { kind: "path", to: "/admin/wiki" },
      },
      {
        label: "Team Leader Dashboard",
        icon: LayoutDashboard,
        target: { kind: "path", to: "/team-leader-dashboard" },
      },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Brand, content, and outreach.",
    icon: Megaphone,
    tiles: [
      {
        label: "Marketing Training",
        icon: BookOpen,
        target: { kind: "path", to: "/courses" },
      },
      {
        label: "Marketing P&P",
        icon: FileText,
        target: { kind: "path", to: "/admin/wiki" },
      },
    ],
  },
];

export const getDepartment = (id: string) =>
  departments.find((d) => d.id === id);
