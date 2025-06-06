
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const useFirstTimeUser = () => {
  const { user } = useAuth();
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if this is the user's first login
    const firstTimeKey = `first_time_${user.id}`;
    const hasSeenWelcome = localStorage.getItem(firstTimeKey);

    if (!hasSeenWelcome) {
      setIsFirstTime(true);
      // Small delay to let the page load before showing effects
      setTimeout(() => {
        setShowConfetti(true);
        setShowWelcome(true);
      }, 500);
    }
  }, [user]);

  const markWelcomeAsSeen = () => {
    if (user) {
      const firstTimeKey = `first_time_${user.id}`;
      localStorage.setItem(firstTimeKey, 'seen');
    }
    setShowWelcome(false);
    setShowConfetti(false);
    setIsFirstTime(false);
  };

  const triggerDemo = () => {
    console.log('triggerDemo called in useFirstTimeUser');
    setShowConfetti(true);
    setShowWelcome(true);
    setIsFirstTime(true); // Set this to true to ensure proper state
  };

  return {
    isFirstTime,
    showWelcome,
    showConfetti,
    markWelcomeAsSeen,
    triggerDemo,
  };
};
