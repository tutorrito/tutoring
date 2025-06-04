import React, { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row']; // This will be updated after types generation

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null; // This profile will not have avatar_url after types generation
  avatarUrl: string | null; // New state for the avatar URL
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ user: User | null; session: Session | null; }>;
  signIn: (email: string, password: string) => Promise<{ session: Session | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Omit<Partial<Profile>, 'avatar_url'>) => Promise<void>; // Explicitly Omit avatar_url for now
  refreshProfile: () => Promise<void>; // To refresh profile and avatar
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // New state for avatar URL
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setAvatarUrl(null); // Clear avatar URL if no session
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      // Fetch main profile data (name, bio, etc.)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*') // avatar_url will be gone from this table after migration
        .eq('id', userId)
        .single();

      if (profileError) {
        throw profileError;
      }
      
      if (profileData) {
        console.log('Fetched profile data in useAuth:', profileData);
        // Explicitly remove avatar_url from the profile state if it exists,
        // as it's moving to profile_images table.
        // This is a temporary measure until types are regenerated.
        const { avatar_url, ...restOfProfile } = profileData as any;
        setProfile(restOfProfile as Profile);
      } else {
        setProfile(null);
      }

      // Fetch the latest avatar image path from profile_images table
      const { data: imageRecord, error: imageError } = await supabase
        .from('profile_images')
        .select('image_path')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1); // Remove .single()

      // Adjust error handling and data processing
      if (imageError) { 
        // Log any error that isn't just "not found" which is expected if no avatar
        // PGRST116 is for .single() when no rows are found. 
        // Without .single(), an empty result isn't an error itself.
        // We'll check for other types of errors.
        // A 406 error might still appear here if it's a fundamental RLS or access issue.
        console.error('Error fetching avatar image from profile_images:', imageError);
        setAvatarUrl(null);
      } else if (imageRecord && imageRecord.length > 0 && imageRecord[0].image_path) {
        // imageRecord is now an array, take the first element
        const { data: { publicUrl } } = supabase.storage
          .from('avatars') // Bucket name
          .getPublicUrl(imageRecord[0].image_path);
        setAvatarUrl(publicUrl);
        console.log('Fetched avatar URL from profile_images:', publicUrl);
      } else {
        // No error, but imageRecord is null, empty, or has no image_path
        setAvatarUrl(null); // No image found or expected "not found"
      }

    } catch (error) {
      console.error('Error fetching profile and/or avatar:', error);
      setProfile(null);
      setAvatarUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw error;
    return { session: data.session };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setAvatarUrl(null); // Clear avatar URL on sign out
  };

  // updateProfile will now only handle non-avatar fields.
  const updateProfile = async (updates: Omit<Partial<Profile>, 'avatar_url'>) => {
    if (!user?.id) {
      console.error('[useAuth|updateProfile] No user ID, aborting update.');
      throw new Error('No user logged in');
    }
    console.log('[useAuth|updateProfile] Received updates:', JSON.stringify(updates));

    // 'updates' is typed as Omit<Partial<Profile>, 'avatar_url'>.
    // The destructuring ensures that if avatar_url was somehow still present (due to 'as any' or type issues),
    // it's separated into the avatar_url variable, and otherUpdates will not have it.
    const { avatar_url, ...otherUpdates } = updates as any; 

    console.log('[useAuth|updateProfile] Payload for "profiles" table (otherUpdates):', JSON.stringify(otherUpdates));

    const { error } = await supabase
      .from('profiles')
      .update(otherUpdates)
      .eq('id', user.id);
      // Removed .select().single() to simplify the call and isolate the update error.

    if (error) {
      console.error('[useAuth|updateProfile] Error response from Supabase during profile update:', JSON.stringify(error));
      console.error('[useAuth|updateProfile] Attempted update payload that failed (otherUpdates):', JSON.stringify(otherUpdates));
      throw error;
    }
    
    console.log('[useAuth|updateProfile] Profile update DB call successful. Refreshing local profile data.');
    // Re-fetch profile to ensure local state is consistent with DB.
    await fetchProfile(user.id); 
  };
  
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        avatarUrl, // Expose avatarUrl
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile, // Expose refreshProfile
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
