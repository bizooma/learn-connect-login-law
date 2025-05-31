
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";
import LawFirmSetup from "./LawFirmSetup";
import SeatManagement from "./SeatManagement";

type LawFirm = Tables<'law_firms'>;

interface SettingsTabProps {
  lawFirm: LawFirm;
}

const SettingsTab = ({ lawFirm }: SettingsTabProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Law Firm Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <LawFirmSetup existingLawFirm={lawFirm} />
        </CardContent>
      </Card>
      
      <SeatManagement lawFirm={lawFirm} />
    </div>
  );
};

export default SettingsTab;
