
import { useState } from "react";
import { Search, BookOpen, Award, Users, Calendar, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import KnowledgeBaseHeader from "@/components/knowledge-base/KnowledgeBaseHeader";
import KnowledgeBaseSection from "@/components/knowledge-base/KnowledgeBaseSection";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const KnowledgeBase = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: BookOpen,
      color: "text-blue-600",
      items: [
        {
          title: "Logging In & Accessing Your Dashboard",
          content: "Learn how to log into your student account and navigate to your personalized dashboard. Your dashboard shows your course progress, certificates earned, and quick access to all platform features."
        },
        {
          title: "Understanding Your Dashboard",
          content: "Your dashboard displays key statistics: Assigned Courses (courses given to you), In Progress (courses you're actively taking), Completed (finished courses), and Certificates (awards you've earned)."
        },
        {
          title: "Navigating Between Sections",
          content: "Use the yellow tabs to switch between Dashboard (course overview), Certificates (your earned awards), and Profile (personal information management)."
        }
      ]
    },
    {
      id: "course-management",
      title: "Course Management",
      icon: Users,
      color: "text-green-600",
      items: [
        {
          title: "Viewing Your Courses",
          content: "Access your courses from the Dashboard tab. Switch between 'Assigned Courses' (new courses) and 'Completed Courses' (finished courses) using the yellow sub-tabs."
        },
        {
          title: "Course Catalog",
          content: "Click 'Course Catalog' in the white header to browse all available courses. This shows you what courses exist on the platform, though you may need assignment to access some."
        },
        {
          title: "Starting a Course",
          content: "Click on any assigned course card to begin. You'll see the course structure with units, modules, and lessons organized in a clear hierarchy."
        },
        {
          title: "Course Progress Tracking",
          content: "Your progress is automatically saved as you complete units. The progress bar shows your completion percentage, and completed sections are marked with checkmarks."
        }
      ]
    },
    {
      id: "taking-courses",
      title: "Taking Courses",
      icon: BookOpen,
      color: "text-purple-600",
      items: [
        {
          title: "Watching Course Videos",
          content: "Each lesson contains video content. Videos track your progress automatically. You can pause, rewind, and take notes while watching."
        },
        {
          title: "Course Structure Navigation",
          content: "Courses are organized as: Course → Units → Modules → Lessons. Use the sidebar to navigate between sections, or use the LMS Tree for a full overview."
        },
        {
          title: "Marking Units Complete",
          content: "After finishing all content in a unit, mark it as complete using the 'Mark as Complete' button. This updates your progress and unlocks the next section."
        },
        {
          title: "Using the LMS Tree",
          content: "Access the LMS Tree from the blue header menu for a bird's-eye view of all course content. This helps you navigate complex courses and track overall progress."
        }
      ]
    },
    {
      id: "quiz-system",
      title: "Quizzes & Assessments",
      icon: HelpCircle,
      color: "text-orange-600",
      items: [
        {
          title: "Taking Quizzes",
          content: "Quizzes appear within course modules. Click 'Start Quiz' to begin. Read each question carefully and select your answers before the timer expires."
        },
        {
          title: "Quiz Navigation",
          content: "Use the Previous/Next buttons to move between questions. You can review and change answers before submitting, as long as time remains."
        },
        {
          title: "Understanding Results",
          content: "After completing a quiz, you'll see your score and which questions you got right or wrong. Some quizzes require a minimum passing score to proceed."
        },
        {
          title: "Retaking Quizzes",
          content: "If you don't pass a quiz on the first try, you can usually retake it. Check with your administrator about retake policies for your courses."
        }
      ]
    },
    {
      id: "calendar-meetings",
      title: "Calendar & Meetings",
      icon: Calendar,
      color: "text-red-600",
      items: [
        {
          title: "Viewing Course Calendar",
          content: "Each course has a calendar tab showing important dates, deadlines, and scheduled meetings. Click on events to see details and join links."
        },
        {
          title: "Event Types",
          content: "Calendar events include: virtual meetings, assignment deadlines, exam dates, and course milestones. Each type is color-coded for easy identification."
        },
        {
          title: "Joining Virtual Meetings",
          content: "For online meetings, click the event in the calendar to find the join link. Make sure to join a few minutes early to test your audio and video."
        }
      ]
    },
    {
      id: "certificates",
      title: "Certificates",
      icon: Award,
      color: "text-yellow-600",
      items: [
        {
          title: "Earning Certificates",
          content: "You earn a certificate when you complete all required course content and pass any required assessments. Certificates are automatically generated upon course completion."
        },
        {
          title: "Viewing Certificate History",
          content: "Go to the Certificates tab to see all your earned certificates. Each entry shows the course name, completion date, and unique certificate number."
        },
        {
          title: "Downloading Certificates",
          content: "Click the 'Download' button next to any certificate to save a PDF copy to your device. You can print these for your records or share with employers."
        },
        {
          title: "Certificate Verification",
          content: "Each certificate has a unique verification number that can be used to confirm its authenticity. Keep this number safe for verification purposes."
        }
      ]
    },
    {
      id: "profile-management",
      title: "Profile Management",
      icon: Users,
      color: "text-indigo-600",
      items: [
        {
          title: "Updating Personal Information",
          content: "Go to the Profile tab to update your name, contact information, and professional details. Keep this information current for certificates and communications."
        },
        {
          title: "Profile Picture",
          content: "Upload a professional profile picture that will appear in your dashboard header and on certificates. Use a clear, professional headshot for best results."
        },
        {
          title: "Law Firm Information",
          content: "If you're associated with a law firm, update your firm name and details in your profile. This information may appear on your certificates and in your profile."
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
                <strong>Technical Issues:</strong> Contact Erin Walsh <a href="mailto:erin.walsh@newfrontier.us" className="text-blue-600 hover:text-blue-800 underline">erin.walsh@newfrontier.us</a>
              </div>
              <div>
                <strong>Content or Marketing Assistance:</strong> Contact Carolina Garrido <a href="mailto:carolina@newfrontieruniversity.com" className="text-blue-600 hover:text-blue-800 underline">carolina@newfrontieruniversity.com</a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KnowledgeBase;
