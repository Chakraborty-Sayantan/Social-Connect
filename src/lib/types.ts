import { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: 'user' | 'admin';
  website: string | null;
  location: string | null;
  visibility: string;
}

export interface Post {
  id: number;
  author_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: Profile;
}

export interface DetailedNotification {
    id: number;
    recipient_id: string;
    sender_id: string;
    post_id: number | null;
    notification_type: 'follow' | 'like' | 'comment';
    message: string;
    is_read: boolean;
    created_at: string;
    sender_username: string;
    sender_avatar_url: string | null;
    post_content: string | null;
}

export type AdminPost = {
    id: number;
    created_at: string;
    content: string;
    is_active: boolean;
    author: {
        username: string;
        avatar_url: string | null;
    } | null;
};

export interface AuthenticatedPageProps {
  user: User;
  profile: Profile;
}