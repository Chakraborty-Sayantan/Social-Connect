'use client'

import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImagePlus } from "lucide-react";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("File size cannot exceed 2MB.");
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim()) {
      toast.error("Post cannot be empty.");
      return;
    }
    setLoading(true);
    
    let imageUrl: string | null = null;
    
    if (file) {
      try {
        const signedUrlResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileType: file.type }),
        });

        if (!signedUrlResponse.ok) {
            const errorData = await signedUrlResponse.json();
            throw new Error(errorData.error || 'Failed to get signed URL.');
        }

        const signedUrlData = await signedUrlResponse.json();
        const { token, path } = signedUrlData;

        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .uploadToSignedUrl(path, token, file);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('post_images')
          .getPublicUrl(path);
        imageUrl = publicUrl;

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Image upload failed: ${errorMessage}`);
        setLoading(false);
        return;
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to post.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('posts')
      .insert({ content, author_id: user.id, image_url: imageUrl, category });

    if (insertError) {
      toast.error(insertError.message);
    } else {
      setContent('');
      setCategory('general');
      setFile(null);
      setPreviewUrl(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Post created successfully!");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-card rounded-lg border shadow-sm">
      <Textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px] border-0 focus-visible:ring-0 ring-offset-0 bg-transparent"
      />
      {previewUrl && (
            <Image
              src={previewUrl}
              alt="Image preview"
              className="rounded-lg max-h-80 w-auto"
              width={400}
              height={320}
              style={{ height: "auto", width: "auto", maxHeight: "20rem" }}
            />
      )}
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="text-muted-foreground" />
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png" className="hidden" />
            <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <Button onClick={handleCreatePost} disabled={loading}>
          {loading ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
}