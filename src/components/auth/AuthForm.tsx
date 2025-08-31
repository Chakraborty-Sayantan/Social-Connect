'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";

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

    if (mode === 'register') {
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
      }

    } else { // Login mode
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });
        
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'An unknown error occurred.');
        }

        router.push('/feed');
        router.refresh(); // Important to re-fetch server data

      } catch (error: unknown) {
        if (error instanceof Error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid login. You may need to register first.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.error("An unknown error occurred.");
        }
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleAuth} className="space-y-6">
      {mode === 'register' ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className='mt-1' />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className='mt-1' />
            </div>
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className='mt-1'/>
          </div>
           <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className='mt-1'/>
          </div>
        </>
      ) : (
        <div>
          <Label htmlFor="identifier">Email or Username</Label>
          <Input id="identifier" type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className='mt-1'/>
        </div>
      )}

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className='mt-1'/>
      </div>

      <Button type="submit" disabled={loading} className="w-full !mt-6">
        {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
      </Button>
    </form>
  );
}