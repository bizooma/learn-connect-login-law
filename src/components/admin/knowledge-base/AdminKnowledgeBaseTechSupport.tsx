
import { Card, CardContent } from "@/components/ui/card";

const AdminKnowledgeBaseTechSupport = () => {
  return (
    <Card className="mt-8 bg-white border-gray-200">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Tech Support</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-700">Call:</span>
            <a 
              href="tel:904-295-6670" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Joseph Murphy - 904-295-6670
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-700">Email:</span>
            <a 
              href="mailto:joe@bizooma.com" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              joe@bizooma.com
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminKnowledgeBaseTechSupport;
