
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

const CalendarTab = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="h-6 w-6 mr-2" />
          Law Firm Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-shrink-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </div>
          <div className="flex-1">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {selectedDate ? `Events for ${selectedDate.toLocaleDateString()}` : 'Select a date'}
                </h3>
                <div className="text-gray-500 text-center py-8">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Calendar functionality will be added here.</p>
                  <p className="text-sm">Schedule meetings, deadlines, and important dates.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarTab;
