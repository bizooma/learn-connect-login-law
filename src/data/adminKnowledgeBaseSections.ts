
import { BookOpen, Users, ClipboardList, Shield, BarChart3, Settings, Brain, Award, Building, UserCheck, Activity, Trophy, Calendar, FileText, TrendingUp, MessageCircle, Globe } from "lucide-react";

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
    title: "Dashboard Overview & Navigation",
    icon: BarChart3,
    color: "text-blue-600",
    items: [
      {
        title: "Understanding the New Hierarchical Navigation",
        content: "The admin dashboard now features a hierarchical navigation system with 4 main categories: Content Management, User Management, Analytics & Monitoring, and System Administration. Each category contains related functions in dropdown menus, making it easier to find specific tools and reducing cognitive load compared to the previous 14-tab system."
      },
      {
        title: "Navigating Admin Categories Efficiently",
        content: "Click on any main category in the yellow navigation bar to see its dropdown menu. The active category is highlighted, and the current section is clearly marked. Use keyboard navigation (Tab and Arrow keys) to navigate through menus efficiently. The hierarchical structure follows modern enterprise software patterns for intuitive use."
      },
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
  },
  {
    id: "badge-management",
    title: "Badge Management System",
    icon: Award,
    color: "text-yellow-600",
    items: [
      {
        title: "Creating Badge Templates",
        content: "Design reusable badge templates in the Badge Templates section. Set the badge name, description, image URL, and color scheme. Templates can be used multiple times to award the same badge to different users. Consider creating badges for milestones, achievements, course completions, and special recognitions."
      },
      {
        title: "Assigning Badges to Users",
        content: "Award badges to users either from templates or create custom one-time badges. Use the Badge Assignment interface to select users and choose appropriate badges. Include meaningful descriptions that explain why the badge was earned. Track badge assignments and monitor their impact on user motivation."
      },
      {
        title: "Badge Display and User Profiles",
        content: "Badges appear prominently on user profiles and dashboards, providing visual recognition of achievements. Users can view their badge collection and see progress toward earning additional badges. Consider using badges as part of gamification strategies to increase engagement and course completion rates."
      },
      {
        title: "Badge Analytics and Impact",
        content: "Monitor badge distribution and effectiveness through analytics. Track which badges motivate users most effectively and adjust your recognition strategy accordingly. Use badges to celebrate both completion milestones and engagement behaviors to foster a positive learning culture."
      }
    ]
  },
  {
    id: "team-management",
    title: "Administrative Team Management",
    icon: UserCheck,
    color: "text-green-600",
    items: [
      {
        title: "Creating and Managing Admin Teams",
        content: "Create teams to organize users for management and reporting purposes. Teams can represent departments, law firms, project groups, or any organizational structure. Set team names, descriptions, and assign team leaders as needed. Teams help streamline course assignments and progress monitoring."
      },
      {
        title: "Adding and Managing Team Members",
        content: "Add users to teams using the team management interface. Users can belong to multiple teams if needed. Remove team members when they change roles or leave the organization. Team membership affects reporting, analytics, and course assignment workflows."
      },
      {
        title: "Team Progress Monitoring",
        content: "Monitor collective team progress across assigned courses. View team-wide completion rates, average progress, and identify team members who may need additional support. Use team analytics to understand learning patterns and optimize training approaches for different groups."
      },
      {
        title: "Team-Based Course Assignments",
        content: "Assign courses to entire teams simultaneously for efficient training rollouts. Use team assignments for mandatory training, onboarding programs, and department-specific courses. Track team completion rates and send targeted reminders to teams that are falling behind."
      }
    ]
  },
  {
    id: "law-firm-management",
    title: "Law Firm Administration",
    icon: Building,
    color: "text-blue-700",
    items: [
      {
        title: "Setting Up Law Firm Profiles",
        content: "Create comprehensive law firm profiles including firm name, owner assignment, logo upload, and seat management. Configure firm-specific settings and branding elements. Law firm profiles serve as the organizational hub for managing employees and tracking firm-wide training progress."
      },
      {
        title: "Employee Management and Seat Allocation",
        content: "Manage law firm employees including adding new team members, updating roles, and tracking seat usage. Monitor seat allocation to ensure compliance with licensing agreements. Remove employees who leave the firm and reassign their seats to new team members as needed."
      },
      {
        title: "Law Firm Calendar and Events",
        content: "Create and manage law firm-specific calendar events including training sessions, firm meetings, and deadlines. Events are visible to all firm employees and integrate with course schedules. Use the calendar to coordinate firm-wide training initiatives and important dates."
      },
      {
        title: "Firm-Wide Progress Reporting",
        content: "Generate reports on law firm training progress including completion rates, compliance status, and individual employee performance. Use these reports for regulatory compliance, performance reviews, and identifying training needs. Export reports for external audits and client requirements."
      },
      {
        title: "Owner Dashboard Management",
        content: "Law firm owners have access to dedicated dashboards showing their firm's training status, employee progress, and resource usage. Owners can assign courses to their employees, monitor compliance, and manage firm settings independently while maintaining admin oversight capabilities."
      }
    ]
  },
  {
    id: "certificate-management",
    title: "Certificate Template Management",
    icon: FileText,
    color: "text-purple-700",
    items: [
      {
        title: "Creating Certificate Templates",
        content: "Design professional certificate templates for course completions. Upload template images, set positioning for dynamic text elements (user name, course title, date), and configure template settings. Templates ensure consistent branding and professional appearance for all issued certificates."
      },
      {
        title: "Automatic Certificate Generation",
        content: "Certificates are automatically generated when users complete courses with all smart completion requirements met. The system populates templates with user-specific information including name, course title, completion date, and unique certificate numbers. No manual intervention required for standard completions."
      },
      {
        title: "Certificate Verification and Security",
        content: "Each certificate includes a unique verification number for authenticity confirmation. Maintain secure records of all issued certificates for compliance and verification purposes. Certificates include completion dates, course details, and digital signatures for legal validity."
      },
      {
        title: "Certificate History and Reissuance",
        content: "Track certificate issuance history and provide reissuance capabilities when needed. Users can download their certificates from their profiles, and administrators can access certificate records for auditing purposes. Maintain long-term certificate archives for compliance requirements."
      }
    ]
  },
  {
    id: "activity-monitoring",
    title: "Enhanced Activity Monitoring",
    icon: Activity,
    color: "text-red-600",
    items: [
      {
        title: "User Session Tracking",
        content: "Monitor detailed user session data including login/logout times, course access patterns, and session duration. Track which courses users access most frequently and identify optimal learning times. Use session data to understand user engagement patterns and platform usage trends."
      },
      {
        title: "Real-Time Activity Dashboard",
        content: "View live activity feeds showing current user sessions, active course access, and real-time engagement metrics. Monitor which users are currently online and what content they're accessing. Use real-time data to provide immediate support and identify system issues."
      },
      {
        title: "Activity Analytics and Reporting",
        content: "Generate comprehensive activity reports including session statistics, user engagement patterns, and platform usage analytics. Export activity data for analysis, compliance reporting, and strategic planning. Use analytics to optimize content delivery and improve user experience."
      },
      {
        title: "Session Management and Troubleshooting",
        content: "Monitor session quality, identify connection issues, and troubleshoot user access problems. Track session interruptions, timeout issues, and technical difficulties. Use session data to improve platform reliability and user experience."
      }
    ]
  },
  {
    id: "leaderboard-management",
    title: "Leaderboard Administration",
    icon: Trophy,
    color: "text-yellow-700",
    items: [
      {
        title: "Managing Learning Streak Leaderboards",
        content: "Monitor and manage learning streak competitions that motivate consistent daily learning. Leaderboards track consecutive days of course engagement and recognize top performers. Use streak leaderboards to encourage regular study habits and increase course completion rates."
      },
      {
        title: "Category-Based Competition Management",
        content: "Create and manage leaderboards for specific course categories (Legal, Sales, etc.). Track completion rates and recognize top performers within each category. Category leaderboards encourage expertise development and create healthy competition within specialized areas."
      },
      {
        title: "Leaderboard Cache and Performance",
        content: "Leaderboards are automatically cached and refreshed regularly for optimal performance. Monitor cache effectiveness and refresh schedules to ensure accurate, up-to-date rankings. The system handles large user bases efficiently while maintaining real-time accuracy for competitive elements."
      },
      {
        title: "Gamification Strategy and Motivation",
        content: "Use leaderboards as part of broader gamification strategies to increase engagement. Balance competition with collaboration by creating team-based leaderboards and individual recognition. Monitor the impact of leaderboards on user motivation and course completion rates."
      }
    ]
  },
  {
    id: "completion-monitoring",
    title: "Completion Monitoring Dashboard",
    icon: TrendingUp,
    color: "text-emerald-600",
    items: [
      {
        title: "Advanced Progress Diagnostics",
        content: "Use the Completion Monitoring Dashboard to identify users with progress inconsistencies, stalled courses, and completion anomalies. The system automatically detects patterns that may indicate technical issues or user difficulties. Proactively address completion problems before they impact compliance."
      },
      {
        title: "Automated Progress Recalculation",
        content: "Run bulk progress recalculation operations when data inconsistencies are detected. The system can automatically correct progress calculations across multiple users and courses. Use this feature after system updates or when migrating data to ensure accuracy."
      },
      {
        title: "Completion Rate Analytics",
        content: "Monitor course completion rates across different user groups, courses, and time periods. Identify courses with unusually low completion rates that may need content revision. Track completion trends to understand seasonal patterns and optimize training schedules."
      },
      {
        title: "Intervention and Support Strategies",
        content: "Identify users who may need additional support based on completion patterns and engagement metrics. Use the monitoring dashboard to trigger automated reminders, assign additional resources, or escalate issues to human trainers. Implement data-driven intervention strategies to improve success rates."
      }
    ]
  },
  {
    id: "chatbot-management",
    title: "AI Chatbot Administration",
    icon: MessageCircle,
    color: "text-cyan-600",
    items: [
      {
        title: "Chatbot System Overview",
        content: "The AI-powered chatbot provides 24/7 support to all platform users through a floating chat widget. The system uses advanced natural language processing to understand user questions and provide contextual responses about platform features, course navigation, and technical support. Monitor chatbot interactions through the analytics dashboard."
      },
      {
        title: "Managing Chatbot Interactions",
        content: "Review chatbot conversation logs to understand common user questions and identify areas where the system can be improved. The chatbot tracks user satisfaction through feedback mechanisms and escalates complex issues to human support when needed. Use interaction data to optimize platform usability."
      },
      {
        title: "Support Ticket Integration",
        content: "The chatbot seamlessly integrates with the support ticket system, allowing users to escalate issues that require human intervention. When users need additional help, the chatbot collects relevant information and creates properly categorized support tickets. Monitor ticket volume and resolution times through the admin dashboard."
      },
      {
        title: "Customizing Chatbot Responses",
        content: "Configure chatbot behavior and response patterns through the admin interface. Update knowledge base articles that the chatbot references, and adjust response templates for common questions. The system learns from admin feedback to improve response accuracy and relevance over time."
      },
      {
        title: "Chatbot Analytics and Performance",
        content: "Track chatbot effectiveness through comprehensive analytics including response accuracy, user satisfaction scores, and escalation rates. Monitor which topics generate the most questions to identify platform areas that may need better documentation or user interface improvements."
      }
    ]
  },
  {
    id: "global-event-management",
    title: "Global Event Management",
    icon: Globe,
    color: "text-emerald-600",
    items: [
      {
        title: "Creating Global Events",
        content: "Create events that appear across multiple course calendars using the Global Event Management system. Events can be targeted to specific courses, user roles (admin, student, owner), or email domains. Use the intuitive dropdown-based interface to select targeting criteria and ensure events reach the right audience."
      },
      {
        title: "Event Targeting Strategies",
        content: "Target events using multiple criteria: Course-based targeting (events appear for users assigned to specific courses), Role-based targeting (events for admins, students, etc.), and Email domain targeting (events for users from specific organizations). Combine targeting methods for precise audience control."
      },
      {
        title: "Multi-Select Event Configuration",
        content: "Use the improved multi-select dropdown interface to efficiently choose courses, roles, and email domains for event targeting. The system shows selected items as removable tags and includes search functionality for large lists. Selected targeting criteria are clearly displayed for easy review and modification."
      },
      {
        title: "Event Types and Categories",
        content: "Create different event types including General announcements, Training sessions, Deadlines, and Meetings. Each type has specific display characteristics and can include meeting links, detailed descriptions, and time specifications. Events integrate seamlessly with user calendars across the platform."
      },
      {
        title: "Calendar Integration and Management",
        content: "Global events automatically populate relevant user calendars based on targeting criteria. Users see events in their personalized calendar views, ensuring important information reaches the right audience. Monitor event visibility and engagement through the analytics dashboard."
      },
      {
        title: "Event Analytics and Effectiveness",
        content: "Track global event performance including view rates, engagement metrics, and user responses. Use analytics to optimize event targeting and improve communication effectiveness. Monitor which event types and targeting strategies generate the best user engagement and course completion rates."
      }
    ]
  }
];
