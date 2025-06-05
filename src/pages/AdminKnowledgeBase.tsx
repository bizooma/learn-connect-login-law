
import { useState, useEffect } from "react";
import AdminKnowledgeBaseHeader from "@/components/admin/knowledge-base/AdminKnowledgeBaseHeader";
import AdminKnowledgeBaseSection from "@/components/admin/knowledge-base/AdminKnowledgeBaseSection";
import AdminKnowledgeBaseSearch from "@/components/admin/knowledge-base/AdminKnowledgeBaseSearch";
import AdminKnowledgeBaseTechSupport from "@/components/admin/knowledge-base/AdminKnowledgeBaseTechSupport";
import AdminKnowledgeBaseNoResults from "@/components/admin/knowledge-base/AdminKnowledgeBaseNoResults";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { adminKnowledgeBaseSections } from "@/data/adminKnowledgeBaseSections";

const AdminKnowledgeBase = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { user, loading: authLoading } = useAuth();
  const { hasAdminPrivileges, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect during loading
    if (authLoading || roleLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
    } else if (!hasAdminPrivileges) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, hasAdminPrivileges, authLoading, roleLoading, navigate]);

  // Show loading while auth/role is being determined
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if user doesn't have admin privileges
  if (!user || !hasAdminPrivileges) {
    return null;
  }

  const filteredSections = adminKnowledgeBaseSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.items.some(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-white">
      <AdminKnowledgeBaseHeader />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Administrator Knowledge Base</h1>
          <p className="text-xl text-gray-600 mb-6">
            Comprehensive guide for managing the learning platform and supporting users
          </p>
          
          <AdminKnowledgeBaseSearch 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        <div className="grid gap-8">
          {filteredSections.map((section) => (
            <AdminKnowledgeBaseSection
              key={section.id}
              title={section.title}
              icon={section.icon}
              color={section.color}
              items={section.items}
              searchTerm={searchTerm}
            />
          ))}
        </div>

        {filteredSections.length === 0 && <AdminKnowledgeBaseNoResults />}

        <AdminKnowledgeBaseTechSupport />
      </div>
    </div>
  );
};

export default AdminKnowledgeBase;
