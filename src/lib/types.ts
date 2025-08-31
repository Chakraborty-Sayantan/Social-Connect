import { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: 'user' | 'admin';
}

export interface Post {
  id: number;
  author_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: Profile;
}

export interface AuthenticatedPageProps {
  user: User;
  profile: Profile;
}