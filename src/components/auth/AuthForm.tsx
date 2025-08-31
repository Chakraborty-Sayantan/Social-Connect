'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [identifier, setIdentifier] = useState(''); 
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
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

      } else { // Login mode - now handled client-side
        let userEmail = identifier;
        
        // If identifier is not an email, assume it's a username and fetch the email
        if (!identifier.includes('@')) {
            const { data, error: rpcError } = await supabase
                .rpc('get_user_email_by_username', { p_username: identifier });

            if (rpcError || !data || data.length === 0) {
                throw new Error("Invalid username or password.");
            }
            userEmail = data[0].email;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password,
        });

        if (signInError) {
            throw new Error("Invalid username or password.");
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
            <p className="text-xs text-muted-foreground mt-1">
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
        <div className="relative mt-1">
            <Input 
                id="password" 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter your password"
                required 
                minLength={6}
                className="pr-10"
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute inset-y-0 right-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
            >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
        </div>
        {mode === 'register' && (
          <p className="text-xs text-muted-foreground mt-1">
            Minimum 6 characters
          </p>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full !mt-6">
        {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
      </Button>
    </form>
  );
}