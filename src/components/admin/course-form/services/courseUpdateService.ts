
import { CourseFormData, ModuleData } from "../types";
import { performEnhancedTransactionalCourseUpdate } from "./enhancedTransactionalCourseUpdate";

export const updateCourse = async (
  courseId: string,
  courseData: CourseFormData,
  modules: ModuleData[]
) => {
  console.log('🔄 Starting course update with enhanced transactional safety...');
  
  try {
    const result = await performEnhancedTransactionalCourseUpdate(
      courseId,
      courseData,
      modules
    );
    
    if (!result.success) {
      throw new Error(`Course update failed: ${result.errors.join(', ')}`);
    }
    
    console.log('✅ Course update completed successfully');
    
    return {
      success: true,
      courseId: result.courseId,
      quizAssignmentsRestored: result.quizAssignmentsRestored,
      warnings: result.warnings,
      performanceMetrics: result.performanceMetrics
    };
    
  } catch (error) {
    console.error('❌ Course update failed:', error);
    throw error;
  }
};
