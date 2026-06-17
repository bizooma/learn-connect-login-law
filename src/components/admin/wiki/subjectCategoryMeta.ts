import { FileText, ClipboardList, Building2, LayoutGrid, type LucideIcon } from "lucide-react";
import type { WikiSubjectCategory } from "@/hooks/useWikiCategories";

export interface SubjectCategoryMeta {
  value: WikiSubjectCategory;
  label: string;
  pluralLabel: string;
  Icon: LucideIcon;
  iconColor: string;
  badgeClass: string;
}

export const SUBJECT_CATEGORIES: SubjectCategoryMeta[] = [
  {
    value: "company",
    label: "Company",
    pluralLabel: "Company",
    Icon: Building2,
    iconColor: "text-amber-600",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "policy",
    label: "Policy",
    pluralLabel: "Policies",
    Icon: FileText,
    iconColor: "text-pink-600",
    badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
  },
  {
    value: "procedure",
    label: "Procedure",
    pluralLabel: "Procedures",
    Icon: ClipboardList,
    iconColor: "text-teal-600",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
  },
];

export const ALL_CONTENT_META = {
  label: "All content",
  Icon: LayoutGrid,
  iconColor: "text-primary",
};

export const getSubjectCategoryMeta = (value: WikiSubjectCategory): SubjectCategoryMeta =>
  SUBJECT_CATEGORIES.find((c) => c.value === value) || SUBJECT_CATEGORIES[0];
