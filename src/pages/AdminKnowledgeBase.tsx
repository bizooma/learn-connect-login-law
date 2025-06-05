import { useState } from "react";
import { Search, Shield, Users, BookOpen, ClipboardList, BarChart3, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminKnowledgeBaseHeader from "@/components/admin/knowledge-base/AdminKnowledgeBaseHeader";
import AdminKnowledgeBaseSection from "@/components/admin/knowledge-base/AdminKnowledgeBaseSection";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

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

  const sections = [
    {
      id: "dashboard-overview",
      title: "Dashboard Overview",
      icon: BarChart3,
      color: "text-blue-600",
      items: [
        {
          title: "Understanding Admin Dashboard Statistics",
          content: "Your admin dashboard displays key metrics including total courses, users, active enrollments, and completed courses. The stats cards show real-time data about platform usage. Use these metrics to track growth, identify trends, and make data-driven decisions about course offerings and user engagement."
        },
        {
          title: "Reading Recent Activity Feed",
          content: "The recent activity section shows the latest user actions across the platform including course enrollments, completions, and user registrations. This feed helps you monitor platform engagement and quickly identify any issues or unusual patterns in user behavior."
        },
        {
          title: "Interpreting User Engagement Data",
          content: "Monitor average progress percentages across all courses to understand how engaging your content is. Low completion rates may indicate content difficulty issues, while high engagement suggests effective course design. Use this data to optimize course structure and content delivery."
        }
      ]
    },
    {
      id: "course-management",
      title: "Course Management",
      icon: BookOpen,
      color: "text-green-600",
      items: [
        {
          title: "Creating New Courses",
          content: "Click 'Create Course' to start building a new course. Fill in basic information including title, description, and category. Upload a course image for better visual appeal. The course structure follows: Course → Modules → Lessons → Units. Plan your content hierarchy before creating to ensure logical flow."
        },
        {
          title: "Understanding Course Structure",
          content: "Courses are organized hierarchically: Courses contain Modules, Modules contain Lessons, and Lessons contain Units. This structure helps organize content logically and allows students to progress through material systematically. Each level can have its own description, images, and metadata."
        },
        {
          title: "Managing Course Content",
          content: "Use the Module Manager to add and organize content within courses. Upload videos, create text content, and add quizzes to units. You can reorder content by dragging and dropping. Use the LMS Tree view for a comprehensive overview of all course content and to make bulk organizational changes."
        },
        {
          title: "Course Editing and Updates",
          content: "Edit existing courses by clicking the edit button on course cards. You can modify course information, restructure content, and update materials. Changes are saved automatically as drafts and can be published when ready. Be cautious when editing active courses as changes affect enrolled students immediately."
        },
        {
          title: "Course Categories and Organization",
          content: "Assign categories to courses for better organization and discovery. Categories help students find relevant content and allow for better filtering in the course catalog. Consider creating categories based on skill level, topic area, or target audience."
        }
      ]
    },
    {
      id: "user-management",
      title: "User Management",
      icon: Users,
      color: "text-purple-600",
      items: [
        {
          title: "Adding New Users",
          content: "Add users individually through the 'Add User' dialog or import multiple users via CSV upload. When adding users, assign appropriate roles (admin, owner, student, client, free) based on their needs. Set up their basic profile information and they'll receive login credentials via email."
        },
        {
          title: "Understanding User Roles",
          content: "Admin: Full platform access and management capabilities. Owner: Law firm owners who can manage their team and course assignments. Student: Regular learners with access to assigned courses. Client: Limited access users. Free: Basic access users with restricted features. Assign roles carefully as they determine platform permissions."
        },
        {
          title: "Managing User Profiles",
          content: "View and edit user profiles including contact information, law firm associations, and profile pictures. You can reset passwords, update email addresses, and modify user roles as needed. Always verify changes with users before making significant profile modifications."
        },
        {
          title: "User Search and Filtering",
          content: "Use the search functionality to quickly find specific users by name, email, or law firm. Filter users by role to manage specific groups. The pagination system helps navigate large user lists efficiently. Use these tools to perform bulk operations and manage user groups effectively."
        },
        {
          title: "Bulk User Import Process",
          content: "Prepare CSV files with required columns: first_name, last_name, email, role, law_firm_name. Upload through the CSV import feature and review any validation errors before confirming. The system will create accounts and send welcome emails automatically. Monitor the import results for any failed entries."
        }
      ]
    },
    {
      id: "course-assignments",
      title: "Course Assignment Management",
      icon: ClipboardList,
      color: "text-orange-600",
      items: [
        {
          title: "Assigning Courses to Users",
          content: "Use the Course Assignment dialog to assign courses to individual users or groups. Select the course, choose users, and optionally add notes about the assignment. Assignments track when users were given access and help monitor compliance with training requirements."
        },
        {
          title: "Bulk Course Assignments",
          content: "Select multiple users and assign courses in bulk for efficient management. This is especially useful for onboarding new employees or rolling out mandatory training. Use filters to select specific user groups (by role, law firm, etc.) for targeted assignments."
        },
        {
          title: "Managing Assignment Status",
          content: "Track assignment status from 'assigned' to 'in progress' to 'completed'. Monitor which users haven't started their assigned courses and send reminders as needed. Use the assignment management tab to view all current assignments and their completion status."
        },
        {
          title: "Assignment Deadlines and Notifications",
          content: "When assigning courses, consider setting deadlines for completion. Use the notification system to remind users of upcoming deadlines. Monitor overdue assignments and follow up with users who are behind schedule."
        }
      ]
    },
    {
      id: "quiz-management",
      title: "Quiz Management",
      icon: Shield,
      color: "text-red-600",
      items: [
        {
          title: "Creating Quizzes Manually",
          content: "Use the Quiz Management section to create new quizzes. Add questions one by one, set correct answers, and configure scoring. Link quizzes to specific course units where they should appear. Set passing scores and determine whether students can retake failed quizzes."
        },
        {
          title: "PowerPoint Quiz Import",
          content: "Import quizzes from PowerPoint presentations using the automated import feature. The system extracts questions and multiple choice answers from slides. Review imported content carefully and make adjustments as needed before publishing. This feature saves significant time when converting existing training materials."
        },
        {
          title: "Quiz Question Types and Formats",
          content: "Support multiple choice questions with single or multiple correct answers. Ensure questions are clear and unambiguous. Write distractors (incorrect answers) that are plausible but clearly wrong. Include explanations for correct answers to enhance learning."
        },
        {
          title: "Quiz Scoring and Analytics",
          content: "Set minimum passing scores based on learning objectives and compliance requirements. Monitor quiz performance across all users to identify questions that may be unclear or content that needs reinforcement. Use analytics to improve question quality and course effectiveness."
        }
      ]
    },
    {
      id: "progress-tracking",
      title: "User Progress Tracking",
      icon: BarChart3,
      color: "text-indigo-600",
      items: [
        {
          title: "Monitoring Individual Progress",
          content: "View detailed progress for each user including courses assigned, in progress, and completed. Track completion percentages for ongoing courses and identify users who may need additional support. Use this data to provide personalized assistance and ensure training goals are met."
        },
        {
          title: "Understanding Progress Metrics",
          content: "Progress is calculated based on completed units within courses. 100% completion means all units and any required quizzes have been finished. Monitor last access times to identify inactive users and engagement patterns to optimize content delivery."
        },
        {
          title: "Generating Progress Reports",
          content: "Export progress data for compliance reporting and training records. Generate reports by user, course, or time period as needed. Use these reports for audits, performance reviews, and demonstrating training compliance to regulatory bodies."
        },
        {
          title: "Certificate Management",
          content: "Certificates are automatically generated when users complete courses with all requirements met. Monitor certificate issuance and maintain records for compliance purposes. Certificates include unique verification numbers and completion dates for authenticity."
        }
      ]
    },
    {
      id: "system-administration",
      title: "System Administration",
      icon: Settings,
      color: "text-gray-600",
      items: [
        {
          title: "Managing System Notifications",
          content: "Create and manage system-wide notifications to communicate important information to users. Set notification types (info, warning, success) and target specific user groups. Schedule notifications for future display and set expiration dates to keep messaging relevant."
        },
        {
          title: "Data Security and Privacy",
          content: "Ensure user data is protected according to privacy regulations. Regularly review user access permissions and remove accounts for users who no longer need access. Monitor system activity for unusual patterns and maintain audit trails for compliance."
        },
        {
          title: "System Performance Monitoring",
          content: "Monitor platform performance including load times, user engagement, and system resource usage. Address performance issues promptly to maintain optimal user experience. Regular maintenance and updates help ensure system stability and security."
        },
        {
          title: "Backup and Data Management",
          content: "Ensure regular backups of user data, course content, and progress records. Maintain data retention policies in accordance with organizational requirements and regulations. Plan for disaster recovery and data restoration procedures."
        }
      ]
    }
  ];

  const filteredSections = sections.filter(section =>
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
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search admin topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3 text-lg bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            />
          </div>
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

        {filteredSections.length === 0 && (
          <Card className="text-center py-12 bg-white border-gray-200">
            <CardContent>
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">
                Try searching with different keywords or browse the sections above.
              </p>
            </CardContent>
          </Card>
        )}

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
      </div>
    </div>
  );
};

export default AdminKnowledgeBase;
