
export const hasGamificationAccess = (email: string | null | undefined): boolean => {
  if (!email) return false;
  
  // Check for exact match: joe@bizooma.com
  if (email === 'joe@bizooma.com') {
    return true;
  }
  
  return false;
};
