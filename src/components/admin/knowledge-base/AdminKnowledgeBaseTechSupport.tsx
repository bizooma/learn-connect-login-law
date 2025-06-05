
import { Card, CardContent } from "@/components/ui/card";

const AdminKnowledgeBaseTechSupport = () => {
  return (
    <Card className="mt-8 bg-white border-gray-200">
      <CardContent className="p-0">
        <div className="flex items-stretch min-h-[120px]">
          {/* Logo Section - Left Side */}
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-l-lg">
            <img 
              src="/lovable-uploads/2eac2a9a-a3dd-486a-9987-03ab5fe057b5.png" 
              alt="Bizooma" 
              className="h-20 w-auto object-contain"
            />
          </div>
          
          {/* Content Section - Right Side */}
          <div className="flex-1 p-6">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminKnowledgeBaseTechSupport;
