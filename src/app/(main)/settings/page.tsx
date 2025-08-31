'use client'

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import AvatarUploader from "@/components/core/AvatarUploader";

export default function SettingsPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(data);
            }
            setLoading(false);
        };
        fetchProfile();
    }, [supabase]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setSaving(true);

        const res = await fetch('/api/users/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: profile.username,
                first_name: profile.first_name,
                last_name: profile.last_name,
                bio: profile.bio,
            }),
        });

        if (res.ok) {
            toast.success("Profile updated successfully!");
        } else {
            toast.error("Failed to update profile.");
        }
        setSaving(false);
    };
    
    if (loading) {
        return <div className="max-w-2xl mx-auto py-8 space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div>
    }
    
    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Settings</h1>
            {profile && (
              <div className="bg-card text-card-foreground p-6 rounded-lg border shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
                  <AvatarUploader 
                      currentAvatarUrl={profile.avatar_url}
                      username={profile.username}
                      onUploadSuccess={(newUrl) => {
                          setProfile({ ...profile, avatar_url: newUrl });
                          router.refresh();
                      }}
                  />
                  <form onSubmit={handleUpdateProfile} className="space-y-6 mt-6">
                      <div>
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} className="mt-2" />
                      </div>
                       <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" value={profile.first_name || ''} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} className="mt-2" />
                      </div>
                       <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" value={profile.last_name || ''} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} className="mt-2" />
                      </div>
                      <div>
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea id="bio" value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="mt-2" />
                      </div>
                      <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                  </form>
              </div>
            )}
            <div className="bg-card text-card-foreground p-6 rounded-lg border shadow-sm mt-8">
                 <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                 <ChangePasswordForm />
            </div>
        </div>
    );
}