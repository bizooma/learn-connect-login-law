import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrgContentSettings {
  publicShareEnabled: boolean;
  pdfDownloadsEnabled: boolean;
  esignaturePermission: string;
  feedbackEnabled: boolean;
  defaultDiscoverability: "discoverable" | "request" | "private";
}

const DEFAULTS: OrgContentSettings = {
  publicShareEnabled: true,
  pdfDownloadsEnabled: true,
  esignaturePermission: "billing_admin",
  feedbackEnabled: true,
  defaultDiscoverability: "discoverable",
};

export const useOrgContentSettings = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["org-content-settings"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<OrgContentSettings> => {
      const { data, error } = await supabase
        .from("organization_settings" as any)
        .select(
          "content_public_share_enabled, content_pdf_downloads_enabled, content_esignature_permission, content_feedback_enabled, content_default_discoverability"
        )
        .eq("singleton", true)
        .maybeSingle();
      if (error || !data) return DEFAULTS;
      const row: any = data;
      return {
        publicShareEnabled: row.content_public_share_enabled ?? true,
        pdfDownloadsEnabled: row.content_pdf_downloads_enabled ?? true,
        esignaturePermission: row.content_esignature_permission ?? "billing_admin",
        feedbackEnabled: row.content_feedback_enabled ?? true,
        defaultDiscoverability: (row.content_default_discoverability ?? "discoverable") as any,
      };
    },
  });

  return { settings: data ?? DEFAULTS, isLoading };
};
