import { useEffect, useState, createContext, useContext } from 'react';
import { sendNewUserNotification } from '@/lib/email';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

type SignUpResult = {
  user: User | null;
  session: Session | null;
  requiresEmailVerification: boolean;
  error: any;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<{ session: Session | null; user: User | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Profile fetch error:', error);
          throw error;
        }
        
        if (mounted) {
          setProfile(data);
          if (!data) {
            console.warn('No profile found for user:', userId);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (mounted) setProfile(null);
      }
    };

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // First check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }
        
        console.log('Session check complete', { session });
        if (session) {
          console.log('Found existing session for user:', session.user?.email);
          setSession(session);
          setUser(session.user);
          if (session.user) {
            await fetchProfile(session.user.id);
          }
        } else {
          console.log('No existing session found');
          setSession(null);
          setUser(null);
          setProfile(null);
        }

        // Set up auth state change listener
        authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;

          console.log('Auth state changed:', { event, session });
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            console.log('User authenticated, fetching profile...', session.user.id);
            await fetchProfile(session.user.id);
          } else {
            console.log('No session, clearing profile');
            setProfile(null);
          }
        }).data.subscription;

      } catch (error) {
        console.error('Error initializing auth:', error);
      }
      // No need to wait for session restore since persistence is disabled
      if (mounted) setLoading(false);
    };

    initializeAuth();

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Validate inputs
      if (!email || !password || !fullName) {
        throw new Error('All fields are required');
      }
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address (e.g. user@example.com)');
      }

      console.log('Attempting signup for:', email);
      const signUpPayload = {
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: Platform.OS === 'web' 
            ? window.location.origin 
            : 'tutorapp://email-verification'
        },
      };
      console.log('Signup payload:', signUpPayload);

      const { data, error } = await supabase.auth.signUp(signUpPayload);

      if (error) {
        console.error('Signup error details:', {
          message: error.message,
          code: error.code,
          status: error.status,
          originalError: error
        });
        throw new Error(`Signup failed: ${error.message}`);
      }
      
      console.log('Detailed signup response:', {
        user: data.user,
        session: data.session,
        requiresEmailVerification: !data.session,
        email: data.user?.email,
        id: data.user?.id,
        createdAt: data.user?.created_at
      });
      
      if (!data.user) {
        console.error('No user object in signup response');
      }

      let result = {
        user: data.user,
        session: data.session,
        requiresEmailVerification: !data.session,
        error: null
      };

      if (data.user) {
        // Send new user notification
        const adminEmail = process.env.EXPO_PUBLIC_ADMIN_EMAIL;
        if (adminEmail) {
          console.log('Sending new user notification to:', adminEmail);
          try {
            await sendNewUserNotification({
              email: email.trim().toLowerCase(),
              name: fullName.trim(),
              adminEmail
            });
            console.log('New user notification sent successfully');
          } catch (error) {
            console.error('Failed to send new user notification:', error);
          }
        } else {
          console.warn('No admin email configured - skipping notification');
        }

        // Create profile with all required fields
        const profileData = {
          id: data.user.id,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          avatar_url: '',
          role: 'student'
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (profileError) {
          console.error('Profile creation failed:', profileError);
          throw new Error('Could not create user profile. Please try again.');
        }
      }

      return result;
    } catch (error) {
      return { 
        user: null,
        session: null,
        requiresEmailVerification: false,
        error 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log(`[signIn] Attempting sign in for: ${email}`); // Added log
    setLoading(true);
    try {
      // Add timeout to prevent infinite loading
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timed out')), 10000)
      );

      console.log('[signIn] Calling supabase.auth.signInWithPassword...'); // Added log
      const signInPromise = supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      let signInResponse: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
      try {
        signInResponse = await Promise.race([
          signInPromise,
          timeout
        ]) as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
        console.log('[signIn] supabase.auth.signInWithPassword call completed.'); // Added log
      } catch (error) {
        console.error('[signIn] Error during signInWithPassword or timeout:', error); // Modified log
        throw error; // Re-throw original error
      }

      const { data: { user, session }, error } = signInResponse;
      
      if (error) {
        console.error('[signIn] Supabase auth error returned:', { // Modified log
          message: error.message,
          status: error.status,
          code: (error as any).code, // Attempt to get code if available
          name: error.name,
        });
        throw error;
      }
      
      if (!user) {
        console.error('[signIn] No user object returned after successful sign in call.'); // Added log
        throw new Error('No user returned from sign in');
      }
      console.log(`[signIn] User object received: ${user.id}, ${user.email}`); // Added log

      // Verify session was properly set
      if (!session) {
        console.warn('[signIn] Sign in successful but no session returned initially. Attempting getSession().'); // Modified log
        const { data: { session: newSession }, error: getSessionError } = await supabase.auth.getSession();
        if (getSessionError) {
           console.error('[signIn] Error calling getSession() after sign in:', getSessionError); // Added log
           throw new Error('Failed to verify session after sign in due to error.');
        }
        if (!newSession) {
          console.error('[signIn] Failed to establish session even after calling getSession().'); // Added log
          throw new Error('Failed to establish session after sign in');
        }
        console.log('[signIn] Session established successfully via getSession().'); // Added log
        return {
          session: newSession,
          user
        };
      }
      console.log(`[signIn] Session received directly: ${session.access_token.substring(0, 10)}...`); // Added log

      return {
        session,
        user
      };
    } catch (error: any) { // Ensure error is typed as any or unknown
      console.error('[signIn] Final catch block:', { // Modified log
        errorMessage: error?.message,
        errorName: error?.name,
        errorStack: error?.stack, // Log stack trace if available
        timestamp: new Date().toISOString(),
        email: email.trim().toLowerCase()
      });
      // Ensure a generic error is thrown if the original error is not an Error instance
      throw error instanceof Error ? error : new Error('An unexpected error occurred during sign in.'); 
    } finally {
      console.log('[signIn] Sign in process finished.'); // Added log
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<void> => {
    if (!user?.id) throw new Error('No user logged in');

    try {
      // Handle avatar upload separately if included
      if (updates.avatar_url && typeof updates.avatar_url !== 'string') {
        const file = updates.avatar_url as File;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Only image files are allowed');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // First ensure bucket exists with proper RLS policies
        try {
          await supabase
            .storage
            .createBucket('avatars', {
              public: false,
              allowedMimeTypes: ['image/*'],
              fileSizeLimit: 1024 * 1024 * 5 // 5MB
            })
            .catch(() => ({})); // Ignore if bucket already exists

          // Set RLS policies for the bucket
          const { error: policyError } = await supabase.rpc('create_storage_policies', {
            bucket_name: 'avatars'
          });
          if (policyError) {
            console.error('Policy setup error:', policyError);
          }
        } catch (error) {
          console.error('Bucket setup error:', error);
        }

        // Upload with proper auth headers
        const { error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: true,
            cacheControl: '3600',
            duplex: 'half'
          });

        if (uploadError) {
          console.error('Upload failed:', uploadError);
          throw new Error(uploadError.message.includes('row-level security') 
            ? 'Permission denied. Please contact support.'
            : 'Failed to upload avatar. Please try again.');
        }

        // Get signed URL that works for private buckets
        const { data, error: urlError } = await supabase.storage
          .from('avatars')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (urlError || !data) {
          throw new Error('Failed to generate image URL');
        }

        // Use the authenticated URL format that includes the access token
        updates.avatar_url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/avatars/${filePath}?token=${session?.access_token}`;
      }

      // Update profile with RLS bypass
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  // Debug logging
  console.log('Auth context:', {
    session: context?.session,
    user: context?.user,
    profile: context?.profile,
    loading: context?.loading,
    hasSignUp: !!context?.signUp,
    hasSignIn: !!context?.signIn,
    hasSignOut: !!context?.signOut,
    hasUpdateProfile: !!context?.updateProfile
  });

  if (!context) {
    console.error('useAuth called outside AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Validate required functions exist
  const requiredFunctions: (keyof AuthContextType)[] = ['signUp', 'signIn', 'signOut', 'updateProfile'];
  const missingFunctions = requiredFunctions.filter(fn => !context[fn]);
  
  if (missingFunctions.length > 0) {
    console.error('Auth context missing required functions:', missingFunctions);
    throw new Error(`Auth context is missing required functions: ${missingFunctions.join(', ')}`);
  }

  // Validate session-user consistency
  if (context.session && !context.user) {
    console.warn('Session exists but user is null - possible auth state inconsistency');
  }

  return context;
};
