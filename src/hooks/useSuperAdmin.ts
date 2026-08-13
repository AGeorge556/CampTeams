import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface UseSuperAdminResult {
  isSuperAdmin: boolean;
  loading: boolean;
}

// Asks the database whether the current user is a super admin instead of
// reading profiles.is_super_admin on the client.
//
// The two are not equivalent: is_super_admin() also matches the bootstrap
// email, so an account created *after* the migration ran is authorised by the
// server while its column is still false. Reading the column directly would
// hide the settings tab from someone the database would happily let save.
// Going through the RPC makes both layers agree by construction, and keeps the
// bootstrap email out of the browser bundle.
export function useSuperAdmin(): UseSuperAdminResult {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async (): Promise<boolean> => {
    const { data, error } = await supabase.rpc('is_super_admin', {});
    if (error) throw error;
    return data === true;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const result = await check();
        if (!cancelled) setIsSuperAdmin(result);
      } catch (error) {
        // Fail closed. A failed check must never grant elevated UI — the worst
        // case is a hidden tab, not an unauthorised one.
        if (!cancelled) {
          console.error('Error checking super admin status:', error);
          setIsSuperAdmin(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    // Re-check on sign in / sign out / token refresh, otherwise the answer is
    // stale for whoever logs in next on the same tab.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      run();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [check]);

  return { isSuperAdmin, loading };
}
