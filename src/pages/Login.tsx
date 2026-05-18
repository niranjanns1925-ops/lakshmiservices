import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../utils/supabase/client';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      
      toast.success('Logged in successfully');
      navigate('/dashboard');
    } catch (error: any) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password.');
      } else {
        toast.error(error.message || 'Failed to login. Check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Failed to login with Google.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex">
        <div className="w-full md:w-1/2 p-8 sm:p-12">
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-16 h-16 mb-4">
              <Logo className="w-full h-full drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back 👋</h1>
            <p className="text-gray-500 mt-2">Login to access your E-Sevai dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            error={errors.email?.message}
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
          />

          <div className="flex justify-end">
            <button type="button" className="text-sm text-primary-600 hover:text-primary-700">
              Forgot password?
            </button>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading} disabled={isGoogleLoading}>
            Login
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2" 
            onClick={handleGoogleSignIn}
            isLoading={isGoogleLoading}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-700" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Google
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            Register here
          </Link>
        </div>
        </div>
        <div className="hidden md:block w-1/2 bg-primary-50 relative overflow-hidden">
          <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop" alt="Login Graphic" className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-12 text-white">
             <h2 className="text-3xl font-bold mb-4">Fast & Secure Access</h2>
             <p className="text-primary-100">Your portal to all essential government services in Tamil Nadu.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

