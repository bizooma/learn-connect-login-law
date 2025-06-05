
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const AdminKnowledgeBaseNoResults = () => {
  return (
    <Card className="text-center py-12 bg-white border-gray-200">
      <CardContent>
        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-600">
          Try searching with different keywords or browse the sections above.
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminKnowledgeBaseNoResults;
