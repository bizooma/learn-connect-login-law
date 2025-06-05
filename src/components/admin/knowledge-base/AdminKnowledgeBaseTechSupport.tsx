
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminKnowledgeBaseTechSupport = () => {
  return (
    <Card className="mt-8 bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900">
          <img 
            src="/lovable-uploads/bizooma-logo.png" 
            alt="Bizooma" 
            className="h-6 w-6 mr-2 object-contain"
          />
          Tech Support
        </CardTitle>
      </CardHeader>
      <CardContent>
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
