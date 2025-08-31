import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { identifier, password } = await request.json();
  const supabase = await createClient();

  if (!identifier || !password) {
    return new NextResponse(JSON.stringify({ error: 'Email/username and password are required.' }), { status: 400 });
  }

  let emailToLogin = identifier;

  // If the identifier doesn't contain '@', we assume it's a username.
  if (!identifier.includes('@')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', identifier) // Use case-insensitive search
      .single();

    if (!profile) {
      return new NextResponse(JSON.stringify({ error: 'Invalid login credentials' }), { status: 400 });
    }
    
    // This is a privileged operation and must be done on the server.
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
    
    if (authError || !authUser.user?.email) {
      return new NextResponse(JSON.stringify({ error: 'Could not find a user with that username.' }), { status: 404 });
    }
    emailToLogin = authUser.user.email;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: emailToLogin,
    password,
  });

  if (error) {
    return new NextResponse(JSON.stringify({ error: 'Invalid login credentials' }), { status: 400 });
  }

  return NextResponse.json({ success: true });
}