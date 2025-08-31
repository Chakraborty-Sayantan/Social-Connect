'use client';

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

interface AvatarUploaderProps {
    currentAvatarUrl: string | null;
    username: string;
    onUploadSuccess: (url: string) => void;
}

export default function AvatarUploader({ currentAvatarUrl, username, onUploadSuccess }: AvatarUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Basic validation for file type and size
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            toast.error('Only JPEG and PNG formats are allowed.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast.error('File size cannot exceed 2MB.');
            return;
        }

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            // Create a unique file path
            const filePath = `${user.id}/${uuidv4()}`;
            
            // Upload the file to the 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get the public URL of the uploaded image
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
            
            // Update the user's profile with the new avatar URL
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);
            
            if(updateError) throw updateError;
            
            onUploadSuccess(publicUrl);
            toast.success("Avatar updated successfully!");

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Upload failed: ${message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24 border-2 border-muted">
                <AvatarImage src={currentAvatarUrl || undefined} alt={`${username}'s avatar`} />
                <AvatarFallback className="text-3xl">
                    {username ? username.charAt(0).toUpperCase() : '?'}
                </AvatarFallback>
            </Avatar>
            <Button asChild>
                <label htmlFor="avatar-upload" className="cursor-pointer">
                    {uploading ? "Uploading..." : "Upload New Avatar"}
                </label>
            </Button>
            <input 
                id="avatar-upload" 
                type="file" 
                accept="image/png, image/jpeg" 
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
            />
        </div>
    );
}