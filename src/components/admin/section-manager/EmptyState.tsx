
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

const EmptyState = () => {
  return (
    <Card>
      <CardContent className="flex items-center justify-center h-32">
        <div className="text-center text-gray-500">
          <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No sections yet. Add your first section to get started.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
