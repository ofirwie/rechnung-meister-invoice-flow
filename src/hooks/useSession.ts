import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute

export const useSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionWarningShown, setSessionWarningShown] = useState(false);
  const { toast } = useToast();

  const checkSessionExpiry = useCallback(() => {
    if (!session?.expires_at) return;

    const expiryTime = new Date(session.expires_at * 1000);
    const now = new Date();
    const timeUntilExpiry = expiryTime.getTime() - now.getTime();

    // Show warning 5 minutes before expiry
    if (timeUntilExpiry <= SESSION_WARNING_TIME && timeUntilExpiry > 0 && !sessionWarningShown) {
      const minutesLeft = Math.floor(timeUntilExpiry / (60 * 1000));
      toast({
        title: "ההתחברות פגה",
        description: `ההתחברות שלך תפוג בעוד ${minutesLeft} דקות.`,
        variant: "destructive",
      });
      setSessionWarningShown(true);
    }

    // Auto redirect if session expired
    if (timeUntilExpiry <= 0) {
      handleSessionExpired();
    }
  }, [session, sessionWarningShown, toast]);

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    setSession(null);
    toast({
      title: "ההתחברות פגה",
      description: "אנא התחבר שוב",
      variant: "destructive",
    });
    // Redirect to auth page
    window.location.href = '/auth';
  }, [toast]);

  const extendSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      setSession(data.session);
      setUser(data.session?.user || null);
      setSessionWarningShown(false);
      
      toast({
        title: "ההתחברות הורחבה",
        description: "ההתחברות שלך הורחבה בהצלחה",
      });
    } catch (error) {
      console.error('Failed to extend session:', error);
      handleSessionExpired();
    }
  }, [toast, handleSessionExpired]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set up session monitoring
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(checkSessionExpiry, SESSION_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [session, checkSessionExpiry]);

  return {
    user,
    session,
    loading,
    extendSession,
    logout,
    isAuthenticated: !!user
  };
};