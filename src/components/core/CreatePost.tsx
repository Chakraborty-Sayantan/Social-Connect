'use client'

import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImagePlus } from "lucide-react";
import Image from "next/image";

export default function CreatePost() {
  const [content, setContent] = useState('');
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
    
    // 1. Handle File Upload if a file is selected
    if (file) {
      try {
        const { data: signedUrlData, error: signedUrlError } = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileType: file.type }),
        }).then(res => res.json());

        if (signedUrlError) throw new Error(signedUrlError.message);

        const { token, path } = signedUrlData;
        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .uploadToSignedUrl(path, token, file);

        if (uploadError) throw uploadError;

        // Get the public URL of the uploaded image
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

    // 2. Insert Post into Database
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to post.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('posts')
      .insert({ content, author_id: user.id, image_url: imageUrl });

    if (insertError) {
      toast.error(insertError.message);
    } else {
      setContent('');
      setFile(null);
      setPreviewUrl(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Post created successfully!");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded-lg border shadow-sm">
      <Textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px] border-0 focus-visible:ring-0 ring-offset-0"
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
        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="text-muted-foreground" />
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg,image/png" className="hidden" />
        <Button onClick={handleCreatePost} disabled={loading}>
          {loading ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
}