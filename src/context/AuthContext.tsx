import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  phone: string;
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, appUser: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (mounted) {
        if (error) {
          console.error('Error fetching session:', error);
        }
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchAppUser(session.user);
        } else {
          setAppUser(null);
        }
        setLoading(false);
      }
    }

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchAppUser(session.user);
          } else {
            setAppUser(null);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchAppUser = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user role:", error);
      }

      if (data) {
        setAppUser(data as AppUser);
      } else {
        const newUser: AppUser = {
          uid: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || 'User',
          role: user.email === 'niranjanns1925@gmail.com' ? 'admin' : 'user',
          phone: ''
        };
        setAppUser(newUser);
        
        // Ensure user is inserted into the public.users table
        const { error: insertError } = await supabase.from('users').insert([{
           uid: newUser.uid,
           email: newUser.email,
           name: newUser.name,
           role: newUser.role,
           phone: newUser.phone
        }]);
        if (insertError) {
           console.error("Error inserting new user:", insertError);
        }
      }
    } catch (error) {
      console.error("Error in fetchAppUser:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

