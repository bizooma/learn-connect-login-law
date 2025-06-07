
import { BookOpen, Users, ClipboardList, Shield, BarChart3, Settings, Brain } from "lucide-react";

export interface AdminKnowledgeBaseItem {
  title: string;
  content: string;
}

export interface AdminKnowledgeBaseSection {
  id: string;
  title: string;
  icon: any;
  color: string;
  items: AdminKnowledgeBaseItem[];
}

export const adminKnowledgeBaseSections: AdminKnowledgeBaseSection[] = [
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
    id: "smart-completion-system",
    title: "Smart Completion System",
    icon: Brain,
    color: "text-purple-600",
    items: [
      {
        title: "Understanding Smart Completion Logic",
        content: "The platform now features an intelligent completion system that automatically determines how units should be completed based on their content. Units with videos are completed when watched to 95%, units with quizzes complete when passed, and units with both require completion of all components. Manual completion is available for content-only units."
      },
      {
        title: "Video Progress Tracking",
        content: "Video progress is automatically tracked for all users. The system monitors watch time, completion percentage, and marks videos as complete at 95% watched. Progress is saved every 5-10 seconds and persists across sessions. Users can see their progress with visual indicators and completion badges."
      },
      {
        title: "Automated Quiz Completion",
        content: "When users pass quizzes (achieve the passing score), the system automatically marks the unit as complete. For units with both video and quiz content, both requirements must be met. The smart completion system evaluates all requirements and triggers completion when criteria are satisfied."
      },
      {
        title: "Completion Strategy Types",
        content: "The system recognizes four completion strategies: 'video_only' (auto-complete on video finish), 'quiz_only' (auto-complete on quiz pass), 'video_and_quiz' (require both), and 'manual_only' (for text/file content). These strategies are automatically determined based on unit content and displayed to users via completion indicators."
      },
      {
        title: "Smart Completion Indicators",
        content: "Visual indicators show users exactly what's required to complete each unit. Green badges indicate completed components, gray badges show pending requirements. Progress bars display video watching progress, and completion status updates in real-time as users engage with content."
      },
      {
        title: "Backwards Compatibility",
        content: "The smart completion system is fully backwards compatible with existing course data. Previously completed units remain completed, and the system gracefully handles units created before the smart completion features were implemented. No data migration is required."
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
        title: "Managing Course Content with Smart Completion",
        content: "When creating units, consider how the smart completion system will handle them. Units with videos will auto-complete when watched, units with quizzes complete when passed. For comprehensive learning, combine videos with quizzes to require both components. Use the Module Manager to organize content and preview how completion requirements will appear to students."
      },
      {
        title: "Video Content Management",
        content: "Upload videos directly or link to YouTube content. The system automatically tracks video progress for all users, marking completion at 95% watched. Consider video length and engagement when designing courses - shorter, focused videos often have better completion rates. Video progress is saved and restored across sessions."
      },
      {
        title: "Quiz Integration and Auto-Completion",
        content: "Attach quizzes to units for automatic completion when passed. Set appropriate passing scores based on learning objectives. The smart completion system will automatically mark units complete when quiz requirements are met. For units with both video and quiz content, both must be completed."
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
        title: "Managing Assignment Status with Smart Completion",
        content: "Track assignment status from 'assigned' to 'in progress' to 'completed'. The smart completion system automatically updates progress as users watch videos and complete quizzes. Monitor which users haven't started their assigned courses and send reminders as needed."
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
        title: "Creating Quizzes with Auto-Completion",
        content: "Use the Quiz Management section to create new quizzes that integrate with the smart completion system. Add questions one by one, set correct answers, and configure scoring. Link quizzes to specific course units where they should appear. Set passing scores - when users achieve this score, the unit will automatically be marked complete."
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
        title: "Quiz Scoring and Auto-Completion Analytics",
        content: "Set minimum passing scores based on learning objectives and compliance requirements. The smart completion system uses these scores to automatically mark units complete. Monitor quiz performance across all users to identify questions that may be unclear or content that needs reinforcement. Use analytics to improve question quality and course effectiveness."
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
        title: "Monitoring Individual Progress with Smart Completion",
        content: "View detailed progress for each user including courses assigned, in progress, and completed. The smart completion system provides granular tracking of video watch progress, quiz attempts, and completion methods. Track completion percentages for ongoing courses and identify users who may need additional support."
      },
      {
        title: "Understanding Enhanced Progress Metrics",
        content: "Progress is now calculated based on multiple factors: video completion (95% threshold), quiz results (passing score achievement), and manual completions. The system tracks completion methods (auto_video_complete, auto_quiz_complete, manual) to provide insights into how users engage with different content types."
      },
      {
        title: "Video Progress Analytics",
        content: "Monitor detailed video watching statistics including watch time, completion rates, and session behavior. Identify videos with low completion rates that may need revision. Track user engagement patterns to optimize content delivery and identify when users may be struggling with material."
      },
      {
        title: "Smart Completion Reporting",
        content: "Generate comprehensive reports showing how users complete units across different content types. Analyze which completion strategies are most effective for your content. Use this data to optimize course design and identify successful learning patterns."
      },
      {
        title: "Generating Progress Reports",
        content: "Export enhanced progress data for compliance reporting and training records. Reports now include completion methods, video watch statistics, and quiz performance analytics. Generate reports by user, course, or time period as needed for audits, performance reviews, and regulatory compliance."
      },
      {
        title: "Certificate Management with Smart Completion",
        content: "Certificates are automatically generated when users complete courses with all smart completion requirements met. The system ensures all videos are watched and quizzes passed before issuing certificates. Monitor certificate issuance and maintain records for compliance purposes with unique verification numbers and completion dates."
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
        title: "Smart Completion System Monitoring",
        content: "Monitor the smart completion system performance including video progress tracking, automatic completions, and system triggers. Review completion analytics to ensure the system is working correctly and users are progressing as expected. Address any issues with automatic completion logic promptly."
      },
      {
        title: "Data Security and Privacy",
        content: "Ensure user data is protected according to privacy regulations. The smart completion system stores additional user interaction data including video progress and completion methods. Regularly review user access permissions and remove accounts for users who no longer need access. Maintain audit trails for compliance."
      },
      {
        title: "System Performance Monitoring",
        content: "Monitor platform performance including load times, user engagement, and system resource usage. The smart completion system adds minimal overhead but should be monitored for optimal performance. Address performance issues promptly to maintain optimal user experience, especially for video progress tracking."
      },
      {
        title: "Backup and Data Management",
        content: "Ensure regular backups of user data, course content, progress records, and smart completion data. Maintain data retention policies in accordance with organizational requirements and regulations. The enhanced tracking system generates more data points, so ensure backup strategies account for increased data volume."
      }
    ]
  }
];
