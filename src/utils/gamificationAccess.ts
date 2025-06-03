
export const hasGamificationAccess = (email: string | null | undefined): boolean => {
  if (!email) return false;
  
  // Check for exact match: joe@bizooma.com
  if (email === 'joe@bizooma.com') {
    return true;
  }
  
  // Check for domain match: any email ending with @newfrontier.us
  if (email.endsWith('@newfrontier.us')) {
    return true;
  }
  
  return false;
};
