
import { BookOpen, Users, ClipboardList, Shield, BarChart3, Settings, Trophy } from "lucide-react";

export interface StudentKnowledgeBaseItem {
  title: string;
  content: string;
}

export interface StudentKnowledgeBaseSection {
  id: string;
  title: string;
  icon: any;
  color: string;
  items: StudentKnowledgeBaseItem[];
}

export const studentKnowledgeBaseSections: StudentKnowledgeBaseSection[] = [
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
    icon: Shield,
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
    id: "leaderboards",
    title: "Leaderboards & Competition",
    icon: Trophy,
    color: "text-yellow-600",
    items: [
      {
        title: "Understanding the Leaderboard System",
        content: "The platform features competitive leaderboards that track and rank student performance across different categories. Leaderboards help motivate learning by showing how you compare to your peers and celebrating top performers. Rankings are updated regularly based on your learning activity and course completion progress."
      },
      {
        title: "Learning Streak Leaderboard",
        content: "The Learning Streak leaderboard ranks students based on consecutive days of learning activity. Your streak increases each day you complete at least one unit or lesson. Streaks of 1 day or more are counted, and you have a 7-day grace period if you miss a day. The leaderboard shows both your current streak and your longest streak achieved. Maintaining consistent daily learning habits will help you climb this leaderboard."
      },
      {
        title: "Category-Based Leaderboards (Sales & Legal)",
        content: "Category leaderboards rank students based on their completion rates within specific course categories like Sales Training and Legal Training. Your ranking is calculated by: (Completed Courses ÷ Total Assigned Courses) × 100. For example, if you've completed 4 out of 5 assigned sales courses, your completion rate is 80%. Students with higher completion rates rank higher, with ties broken by the total number of courses completed."
      },
      {
        title: "How Rankings Are Calculated",
        content: "Rankings are calculated differently for each leaderboard type: Learning Streaks rank by current streak length (with longest streak as tiebreaker), Category leaderboards rank by completion percentage (with total completed courses as tiebreaker). Rankings are cached and refreshed periodically to ensure fair and accurate competition. Only active users who have recent learning activity appear on the leaderboards."
      },
      {
        title: "Viewing Your Rank and Progress",
        content: "Access leaderboards from the main navigation menu to see where you stand among your peers. Each leaderboard shows the top performers with their names, scores, and ranking positions. You can see your current streaks, completion rates, and how close you are to moving up in the rankings. Use leaderboards as motivation to maintain consistent learning habits and complete your assigned courses."
      },
      {
        title: "Leaderboard Eligibility and Fair Play",
        content: "To appear on leaderboards, you must have active learning progress and meet minimum requirements for each category. Learning streak leaderboards require at least 1 consecutive day of activity, while category leaderboards require at least one assigned course in that category. Only students with recent activity (within the last 7 days for streaks) are shown to keep leaderboards current and relevant."
      }
    ]
  },
  {
    id: "certificates",
    title: "Certificates",
    icon: BarChart3,
    color: "text-indigo-600",
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
    icon: Settings,
    color: "text-gray-600",
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
