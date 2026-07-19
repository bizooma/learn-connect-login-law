// Centralized mapping from raw group names to fixed departments.
// Used by the "By Team" view on AdminWikiPage.

export const DEPARTMENTS = [
  "Legal",
  "Sales",
  "Marketing",
  "People & Culture",
  "Finance",
  "Operations",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

// Groups explicitly ignored (not departments)
const IGNORED_GROUPS = new Set(
  ["Everyone", "Admin", "Dragon", "The A-Team"].map((s) => s.toLowerCase()),
);

// Groups that map to multiple departments
const MULTI_MAP: Record<string, Department[]> = {
  "marketing & sales": ["Sales", "Marketing"],
  "marketing & sales team": ["Sales", "Marketing"],
  "director of sales & marketing": ["Sales", "Marketing"],
};

const SINGLE_MAP: Record<string, Department> = {};
const registerSingle = (dept: Department, names: string[]) => {
  names.forEach((n) => {
    SINGLE_MAP[n.toLowerCase()] = dept;
  });
};

registerSingle("Legal", [
  "Legal",
  "Legal Team",
  "Legal Support Team",
  "Legal Assistant",
  "Legal Assistant Lead",
  "Legal/Case Project Manager",
  "Paralegal",
  "Law Clerk",
  "Attorney",
  "Associate Attorney",
  "Senior Associate Attorney",
  "Lawyer",
  "Declaration Drafter",
  "Docketing Specialist",
]);

registerSingle("Sales", [
  "Sales & Intake",
  "Sales Supervisor (Captain)",
  "Sales Trainer/QA",
]);

registerSingle("Marketing", ["Marketing"]);
registerSingle("People & Culture", ["People & Culture Team"]);
registerSingle("Finance", ["Finance Team"]);

registerSingle("Operations", [
  "Operations",
  "Operations Team",
  "Head of Operations",
  "Reception Captain",
  "Receptionist",
  "Glendale & Phoenix Office Team",
]);

export const GROUP_TO_DEPARTMENT = (groupName: string): Department[] => {
  const key = groupName.trim().toLowerCase();
  if (IGNORED_GROUPS.has(key)) return [];
  if (MULTI_MAP[key]) return MULTI_MAP[key];
  const single = SINGLE_MAP[key];
  return single ? [single] : [];
};
