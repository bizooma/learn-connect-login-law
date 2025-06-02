
import { Gift } from "lucide-react";

const FreeResourcesTab = () => {
  return (
    <div className="text-center py-16">
      <Gift className="h-16 w-16 mx-auto text-emerald-400 mb-6" />
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
        Free Resources Coming Soon
      </h3>
      <p className="text-gray-600 max-w-md mx-auto mb-6">
        We're preparing amazing free learning resources just for you. 
        Stay tuned for updates on available content!
      </p>
      <div className="space-y-4 max-w-md mx-auto">
        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
          <span className="text-emerald-800 font-medium">Free Articles</span>
          <span className="text-emerald-600 text-sm">Coming Soon</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
          <span className="text-emerald-800 font-medium">Basic Tutorials</span>
          <span className="text-emerald-600 text-sm">Coming Soon</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
          <span className="text-emerald-800 font-medium">Resource Library</span>
          <span className="text-emerald-600 text-sm">Coming Soon</span>
        </div>
      </div>
    </div>
  );
};

export default FreeResourcesTab;
