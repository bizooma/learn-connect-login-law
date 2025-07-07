
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export const checkQuizNameExists = async (name: string, excludeId?: string): Promise<boolean> => {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return false;
  }

  let query = supabase
    .from('quizzes')
    .select('id')
    .eq('is_deleted', false)
    .is('deleted_at', null)
    .ilike('title', trimmedName);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error checking quiz name:', error);
    return false;
  }

  return (data && data.length > 0);
};

export const validateQuizName = async (name: string, excludeId?: string): Promise<{ isValid: boolean; error?: string }> => {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, error: "Quiz title is required" };
  }

  if (trimmedName.length < 2) {
    return { isValid: false, error: "Quiz title must be at least 2 characters long" };
  }

  const nameExists = await checkQuizNameExists(trimmedName, excludeId);
  
  if (nameExists) {
    return { isValid: false, error: `A quiz with the title "${trimmedName}" already exists. Please choose a different name.` };
  }

  return { isValid: true };
};
