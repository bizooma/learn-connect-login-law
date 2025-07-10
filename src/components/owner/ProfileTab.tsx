
import React from "react";
import { Tables } from "@/integrations/supabase/types";
import LawFirmLogoUpload from "./LawFirmLogoUpload";
import LawFirmInfoSection from "./LawFirmInfoSection";
import PersonalProfileSection from "./PersonalProfileSection";
import PasswordChangeSection from "@/components/shared/PasswordChangeSection";
import CancelAccountSection from "./CancelAccountSection";

type LawFirm = Tables<'law_firms'>;

interface ProfileTabProps {
  lawFirm: LawFirm;
  onUpdateLawFirm: (updates: Partial<LawFirm>) => Promise<LawFirm | null>;
}

const ProfileTab = ({ lawFirm, onUpdateLawFirm }: ProfileTabProps) => {
  return (
    <div className="space-y-6">
      <LawFirmInfoSection 
        lawFirm={lawFirm} 
        onUpdateLawFirm={onUpdateLawFirm} 
      />

      <LawFirmLogoUpload 
        lawFirm={lawFirm} 
        onUpdate={onUpdateLawFirm} 
      />

      <PersonalProfileSection />

      <PasswordChangeSection />

      <CancelAccountSection />
    </div>
  );
};

export default ProfileTab;
