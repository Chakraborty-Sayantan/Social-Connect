import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/feed';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code); // This line exchanges the code for a session and sets the cookie
    if (error) {
      console.error(error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // URL to redirect to after the sign-in process completes
  return NextResponse.redirect(new URL(next, request.url));
}