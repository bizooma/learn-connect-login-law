
import { useState } from "react";
import { Search, BookOpen, Award, Users, Calendar, HelpCircle, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import KnowledgeBaseHeader from "@/components/knowledge-base/KnowledgeBaseHeader";
import KnowledgeBaseSection from "@/components/knowledge-base/KnowledgeBaseSection";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { studentKnowledgeBaseSections } from "@/data/studentKnowledgeBaseSections";

const KnowledgeBase = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const filteredSections = studentKnowledgeBaseSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.items.some(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100">
      <KnowledgeBaseHeader />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Student Knowledge Base</h1>
          <p className="text-xl text-gray-600 mb-6">
            Everything you need to know about using the learning platform
          </p>
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search help topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3 text-lg"
            />
          </div>
        </div>

        <div className="grid gap-8">
          {filteredSections.map((section) => (
            <KnowledgeBaseSection
              key={section.id}
              title={section.title}
              icon={section.icon}
              color={section.color}
              items={section.items}
              searchTerm={searchTerm}
            />
          ))}
        </div>

        {filteredSections.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">
                Try searching with different keywords or browse the sections above.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <HelpCircle className="h-5 w-5 mr-2" />
              Need Additional Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-blue-600 space-y-2">
              <div>
                <strong>Technical Issues:</strong> Contact <a href="mailto:sales@newfrontier.us" className="text-blue-600 hover:text-blue-800 underline">sales@newfrontier.us</a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KnowledgeBase;
