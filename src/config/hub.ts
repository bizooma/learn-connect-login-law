import {
  Scale,
  Users,
  Megaphone,
  HeartHandshake,
  Wallet,
  Settings2,
  Circle,
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

// Placeholder target until real LMS/P&P links are provided per tile.
const placeholder: TileTarget = { kind: "path", to: "/courses" };

const tile = (label: string): Tile => ({
  label,
  icon: Circle,
  target: placeholder,
});

/**
 * Hub structure provided by the client.
 * Tile targets are placeholders — swap in real LMS course / P&P page links per tile.
 */
export const departments: Department[] = [
  {
    id: "legal",
    name: "Legal",
    description: "Case work across the legal team.",
    icon: Scale,
    tiles: [
      tile("Onboarding"),
      tile("Paralegal"),
      tile("Attorney"),
      tile("Revision"),
      tile("Post Filing"),
      tile("Other"),
    ],
  },
  {
    id: "sales",
    name: "Sales",
    description: "Intake, reception, and client-facing sales teams.",
    icon: HeartHandshake,
    tiles: [
      tile("Digital Intake Team"),
      tile("Intake Team"),
      tile("Lives Changed Team"),
      tile("Reception"),
      tile("Office Management"),
      tile("Other"),
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Brand, events, and outreach.",
    icon: Megaphone,
    tiles: [
      tile("Client Events"),
      tile("Social Media"),
      tile("Other"),
    ],
  },
  {
    id: "people-culture",
    name: "People & Culture",
    description: "HR, hiring, and team onboarding.",
    icon: Users,
    tiles: [
      tile("Payroll"),
      tile("Recruitment"),
      tile("Onboarding"),
      tile("Other"),
    ],
  },
  {
    id: "finance",
    name: "Finance",
    description: "Collections and financial operations.",
    icon: Wallet,
    tiles: [
      tile("Collections"),
      tile("Other"),
    ],
  },
  {
    id: "operations",
    name: "Operations",
    description: "Systems, automation, and internal tooling.",
    icon: Settings2,
    tiles: [
      tile("Legal Automation"),
      tile("Other"),
    ],
  },
];

export const getDepartment = (id: string) =>
  departments.find((d) => d.id === id);
