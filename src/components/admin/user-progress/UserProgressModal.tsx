
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User } from "lucide-react";
import UserProgressHeader from "./UserProgressHeader";
import UserProgressStats from "./UserProgressStats";
import UserProgressCourseList from "./UserProgressCourseList";
import { useUserProgressData } from "./hooks/useUserProgressData";

interface UserProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

const UserProgressModal = ({ isOpen, onClose, userId }: UserProgressModalProps) => {
  const { userProgress, loading, fetchUserProgress, handleDeleteAssignment } = useUserProgressData();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserProgress(userId);
    }
  }, [isOpen, userId]);

  const handleDeleteCourse = (courseId: string) => {
    if (userId) {
      handleDeleteAssignment(userId, courseId);
    }
  };

  if (!userProgress && !loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Progress Details</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-gray-500">
            No progress data found for this user.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const completedCourses = userProgress?.courses.filter(c => c.status === 'completed').length || 0;
  const inProgressCourses = userProgress?.courses.filter(c => c.status === 'in_progress').length || 0;
  const totalCourses = userProgress?.courses.length || 0;
  const averageProgress = totalCourses > 0 
    ? Math.round((userProgress?.courses.reduce((sum, c) => sum + c.progress_percentage, 0) || 0) / totalCourses)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Progress Dashboard
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : userProgress && (
          <div className="space-y-6">
            <UserProgressHeader
              userName={userProgress.user_name}
              userEmail={userProgress.user_email}
              onClose={onClose}
            />

            <UserProgressStats
              totalCourses={totalCourses}
              completedCourses={completedCourses}
              inProgressCourses={inProgressCourses}
              averageProgress={averageProgress}
            />

            <UserProgressCourseList
              courses={userProgress.courses}
              onDeleteCourse={handleDeleteCourse}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProgressModal;
