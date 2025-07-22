import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ImmigrationLawTrainingCard = () => {
  const navigate = useNavigate();

  const handleStartCourse = () => {
    navigate("/course/a956b14f-05a3-48bf-b6e4-65a7f3c5f89f");
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
      <CardContent className="p-0">
        <div className="relative">
          {/* Hero Image */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src="/lovable-uploads/b2e5bcfd-b639-4b07-b265-d7c627ab1b3c.png" 
              alt="Free 30 Day Immigration Law Training" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Badge */}
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900">
              FREE COURSE
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold leading-tight">
              FREE 30 DAY IMMIGRATION LAW TRAINING
            </h2>
            
            {/* Description */}
            <p className="text-blue-100 leading-relaxed">
              Master the fundamentals of immigration law with our comprehensive 30-day training program. 
              Perfect for legal professionals looking to expand their expertise.
            </p>
            
            {/* Course Stats */}
            <div className="flex items-center gap-6 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>30 Days</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Self-Paced</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>Certificate</span>
              </div>
            </div>
            
            {/* CTA Button */}
            <div className="pt-2">
              <Button 
                onClick={handleStartCourse}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-3 text-base shadow-lg"
              >
                Start Course Now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImmigrationLawTrainingCard;