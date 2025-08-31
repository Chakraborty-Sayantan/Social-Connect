import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();
    
    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let email = identifier;

    // Check if identifier is an email or username
    if (!identifier.includes('@')) {
      // It's a username, get the email using our RPC function
      const { data: emailData, error: emailError } = await supabase
        .rpc('get_user_email_by_username', { p_username: identifier });

      console.log('Username lookup result:', { emailData, emailError });

      if (emailError) {
        console.error('Error looking up username:', emailError);
        return NextResponse.json(
          { error: 'Could not find a user with that username' },
          { status: 404 }
        );
      }

      if (!emailData || emailData.length === 0) {
        return NextResponse.json(
          { error: 'Could not find a user with that username' },
          { status: 404 }
        );
      }

      email = emailData[0].email;
      console.log('Found email for username:', email);
    }

    // Now sign in with the email
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError) {
      console.error('Sign in error:', signInError);
      
      if (signInError.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Invalid username/email or password' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: signInError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      user: data.user,
      session: data.session 
    });

  } catch (error) {
    console.error('Unexpected login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}