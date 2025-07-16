
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';

export const useFirstTimeUser = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!user) {
      // Reset state when user logs out
      setIsFirstTime(false);
      setShowWelcome(false);
      setShowConfetti(false);
      return;
    }

    console.log('useFirstTimeUser: Checking first time status for user:', user.id);
    
    // Check if this is the user's first login
    const firstTimeKey = `first_time_${user.id}`;
    const hasSeenWelcome = localStorage.getItem(firstTimeKey);
    
    console.log('useFirstTimeUser: hasSeenWelcome =', hasSeenWelcome);

    if (!hasSeenWelcome) {
      console.log('useFirstTimeUser: First time user detected, showing welcome');
      setIsFirstTime(true);
      // Small delay to let the page load before showing effects
      setTimeout(() => {
        setShowConfetti(true);
        setShowWelcome(true);
      }, 500);
    } else {
      console.log('useFirstTimeUser: User has already seen welcome');
      setIsFirstTime(false);
      setShowWelcome(false);
      setShowConfetti(false);
    }
  }, [user?.id]); // Use user.id as dependency to ensure it re-runs when user changes

  const markWelcomeAsSeen = () => {
    console.log('useFirstTimeUser: Marking welcome as seen for user:', user?.id);
    if (user) {
      const firstTimeKey = `first_time_${user.id}`;
      localStorage.setItem(firstTimeKey, 'seen');
    }
    setShowWelcome(false);
    setShowConfetti(false);
    setIsFirstTime(false);
  };

  const triggerDemo = () => {
    console.log('useFirstTimeUser: triggerDemo called');
    
    if (isMobile) {
      // On mobile, show a toast notification instead of the popup
      toast({
        title: "Welcome! 🎉",
        description: "Thanks for trying the demo! Explore the dashboard features.",
      });
    } else {
      // On desktop, show the full welcome experience
      setShowConfetti(true);
      setShowWelcome(true);
      setIsFirstTime(true); // Set this to true to ensure proper state
    }
  };

  return {
    isFirstTime,
    showWelcome,
    showConfetti,
    markWelcomeAsSeen,
    triggerDemo,
  };
};
