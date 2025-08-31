'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import Link from 'next/link';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode }: AuthFormProps) {
  // State for login form
  const [identifier, setIdentifier] = useState(''); 
  
  // State for registration form
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Common state
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        // Check if username already exists before registering
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .maybeSingle();

        if (existingProfile) {
          toast.error('Username already taken. Please choose a different username.');
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
              first_name: firstName,
              last_name: lastName,
            },
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Registration successful! Please check your email to confirm.");
          router.push('/login');
        }

      } else { // Login mode
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });
        
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'An unknown error occurred.');
        }

        toast.success('Welcome back!');
        router.push('/feed');
        router.refresh();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAuth} className="space-y-6">
      {mode === 'register' ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                required 
                className='mt-1' 
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                required 
                className='mt-1' 
              />
            </div>
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username" 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
              placeholder="Choose a unique username"
              required 
              className='mt-1'
              minLength={3}
              maxLength={30}
            />
            <p className="text-xs text-gray-500 mt-1">
              3-30 characters, letters, numbers, and underscores only
            </p>
          </div>
           <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className='mt-1'
            />
          </div>
        </>
      ) : (
        <div>
          <Label htmlFor="identifier">Email or Username</Label>
          <Input 
            id="identifier" 
            type="text" 
            value={identifier} 
            onChange={(e) => setIdentifier(e.target.value)} 
            placeholder="Enter your email or username"
            required 
            className='mt-1'
          />
        </div>
      )}

      <div>
        <Label htmlFor="password">Password</Label>
        <Input 
          id="password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Enter your password"
          required 
          className='mt-1'
          minLength={6}
        />
        {mode === 'register' && (
          <p className="text-xs text-gray-500 mt-1">
            Minimum 6 characters
          </p>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full !mt-6">
        {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
      </Button>
      
     {/*  {mode === 'login' && (
        <p className="text-center text-sm text-gray-600 mt-4">
          Don&apos;t have an account?{' '}
          <Button variant="link" className="p-0 h-auto font-medium text-indigo-600 hover:text-indigo-500" asChild>
            <Link href="/register">Sign up here</Link>
          </Button>
        </p>
      )} */}
    </form>
  );
}