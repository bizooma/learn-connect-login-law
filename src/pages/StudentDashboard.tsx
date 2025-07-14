
import StudentDashboard from "@/components/StudentDashboard";
import ErrorBoundary from "@/components/ErrorBoundary";

const StudentDashboardPage = () => {
  return (
    <ErrorBoundary>
      <StudentDashboard />
    </ErrorBoundary>
  );
};

export default StudentDashboardPage;
