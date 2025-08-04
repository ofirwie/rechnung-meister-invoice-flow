import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute

export const useSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionWarningShown, setSessionWarningShown] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  const checkSessionExpiry = useCallback(() => {
    if (!isMountedRef.current || !session?.expires_at) return;

    const expiryTime = new Date(session.expires_at * 1000);
    const now = new Date();
    const timeUntilExpiry = expiryTime.getTime() - now.getTime();

    // Show warning 5 minutes before expiry
    if (timeUntilExpiry <= SESSION_WARNING_TIME && timeUntilExpiry > 0 && !sessionWarningShown) {
      const minutesLeft = Math.floor(timeUntilExpiry / (60 * 1000));
      try {
        toast({
          title: "ההתחברות פגה",
          description: `ההתחברות שלך תפוג בעוד ${minutesLeft} דקות.`,
          variant: "destructive",
        });
        setSessionWarningShown(true);
      } catch (error) {
        console.warn('Toast failed during session expiry warning:', error);
      }
    }

    // Auto redirect if session expired
    if (timeUntilExpiry <= 0 && isMountedRef.current) {
      handleSessionExpired();
    }
  }, [session, sessionWarningShown, toast]);

  const handleSessionExpired = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setUser(null);
    setSession(null);
    
    // Use try-catch for toast in case component is unmounting
    try {
      toast({
        title: "ההתחברות פגה",
        description: "אנא התחבר שוב",
        variant: "destructive",
      });
    } catch (error) {
      console.warn('Toast failed during session expiry:', error);
    }
    
    // Use React Router navigation instead of window.location
    try {
      navigate('/auth', { replace: true });
    } catch (error) {
      console.warn('Navigation failed, falling back to window.location:', error);
      window.location.href = '/auth';
    }
  }, [toast, navigate]);

  const extendSession = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (!isMountedRef.current) return; // Check again after async operation
      
      setSession(data.session);
      setUser(data.session?.user || null);
      setSessionWarningShown(false);
      
      try {
        toast({
          title: "ההתחברות הורחבה",
          description: "ההתחברות שלך הורחבה בהצלחה",
        });
      } catch (toastError) {
        console.warn('Toast failed during session extension:', toastError);
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
      if (isMountedRef.current) {
        handleSessionExpired();
      }
    }
  }, [toast, handleSessionExpired]);

  const logout = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      await supabase.auth.signOut();
      
      if (!isMountedRef.current) return; // Check after async operation
      
      setUser(null);
      setSession(null);
      
      try {
        navigate('/auth', { replace: true });
      } catch (navError) {
        console.warn('Navigation failed during logout, using window.location:', navError);
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to auth page
      if (isMountedRef.current) {
        try {
          navigate('/auth', { replace: true });
        } catch (navError) {
          window.location.href = '/auth';
        }
      }
    }
  }, [navigate]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMountedRef.current) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Reset warning flag when session changes
        setSessionWarningShown(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMountedRef.current) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Failed to get session:', error);
      if (isMountedRef.current) {
        setLoading(false);
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Set up session monitoring
  useEffect(() => {
    if (!session || !isMountedRef.current) return;

    const interval = setInterval(() => {
      if (isMountedRef.current) {
        checkSessionExpiry();
      }
    }, SESSION_CHECK_INTERVAL);
    
    return () => {
      clearInterval(interval);
    };
  }, [session, checkSessionExpiry]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    user,
    session,
    loading,
    extendSession,
    logout,
    isAuthenticated: !!user
  };
};
