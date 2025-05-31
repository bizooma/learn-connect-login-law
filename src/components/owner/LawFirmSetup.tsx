
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLawFirm } from "@/hooks/useLawFirm";
import { Tables } from "@/integrations/supabase/types";

type LawFirm = Tables<'law_firms'>;

interface LawFirmSetupProps {
  existingLawFirm?: LawFirm;
}

const LawFirmSetup = ({ existingLawFirm }: LawFirmSetupProps) => {
  const { createLawFirm, updateLawFirm } = useLawFirm();
  const [formData, setFormData] = useState({
    name: existingLawFirm?.name || "",
    totalSeats: existingLawFirm?.total_seats || 5,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    setLoading(true);

    try {
      if (existingLawFirm) {
        await updateLawFirm({
          name: formData.name,
          total_seats: formData.totalSeats
        });
      } else {
        await createLawFirm(formData.name, formData.totalSeats);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalSeats' ? parseInt(value) || 0 : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Law Firm Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your law firm name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalSeats">Total Employee Seats</Label>
        <Input
          id="totalSeats"
          name="totalSeats"
          type="number"
          min="1"
          max="1000"
          value={formData.totalSeats}
          onChange={handleChange}
          placeholder="Number of employee seats"
          required
        />
        <p className="text-sm text-gray-500">
          This determines how many employees you can add to your law firm.
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : existingLawFirm ? "Update Law Firm" : "Create Law Firm"}
      </Button>
    </form>
  );
};

export default LawFirmSetup;
