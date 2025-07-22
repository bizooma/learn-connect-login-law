
import ImmigrationLawTrainingCard from "./ImmigrationLawTrainingCard";

const FreeResourcesTab = () => {
  return (
    <div className="space-y-8">
      {/* Featured Course */}
      <div className="max-w-2xl mx-auto">
        <ImmigrationLawTrainingCard />
      </div>
      
      {/* Additional Resources */}
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Additional Free Resources
        </h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          More free learning resources coming soon to help you succeed in your legal career.
        </p>
        <div className="space-y-3 max-w-md mx-auto">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700 font-medium">Legal Articles</span>
            <span className="text-gray-500 text-sm">Coming Soon</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700 font-medium">Practice Guides</span>
            <span className="text-gray-500 text-sm">Coming Soon</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700 font-medium">Resource Library</span>
            <span className="text-gray-500 text-sm">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeResourcesTab;
