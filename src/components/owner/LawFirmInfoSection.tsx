
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { Building2 } from "lucide-react";
import { logger } from "@/utils/logger";

type LawFirm = Tables<'law_firms'>;

interface LawFirmInfoSectionProps {
  lawFirm: LawFirm;
  onUpdateLawFirm: (updates: Partial<LawFirm>) => Promise<LawFirm | null>;
}

const LawFirmInfoSection = ({ lawFirm, onUpdateLawFirm }: LawFirmInfoSectionProps) => {
  const [lawFirmName, setLawFirmName] = useState(lawFirm.name);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveLawFirmName = async () => {
    if (!lawFirmName.trim()) {
      toast({
        title: "Error",
        description: "Law firm name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await onUpdateLawFirm({ name: lawFirmName.trim() });
      toast({
        title: "Success",
        description: "Law firm name updated successfully",
      });
    } catch (error) {
      logger.error('Error updating law firm name:', error);
      toast({
        title: "Error",
        description: "Failed to update law firm name",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Law Firm Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="law-firm-name">Law Firm Name</Label>
          <div className="flex space-x-2">
            <Input
              id="law-firm-name"
              value={lawFirmName}
              onChange={(e) => setLawFirmName(e.target.value)}
              placeholder="Enter your law firm name"
              disabled={saving}
            />
            <Button 
              onClick={handleSaveLawFirmName}
              disabled={saving || lawFirmName.trim() === lawFirm.name}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LawFirmInfoSection;
