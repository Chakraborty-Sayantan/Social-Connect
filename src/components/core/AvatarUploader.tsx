'use client';

import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Camera } from "lucide-react";
import { processImageForAvatar } from "@/lib/image-utils";

interface AvatarUploaderProps {
    currentAvatarUrl: string | null;
    username: string;
    onUploadSuccess: (url: string) => void;
}

export default function AvatarUploader({ currentAvatarUrl, username, onUploadSuccess }: AvatarUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState<Crop>();
    const [open, setOpen] = useState(false);
    
    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const supabase = createClient();

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        const initialCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
            width,
            height
        );
        setCrop(initialCrop);
    }

    const onSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file.');
                return;
            }
            setCrop(undefined); // Reset crop on new image
            try {
                const processedDataUrl = await processImageForAvatar(file);
                setImgSrc(processedDataUrl);
            } catch (error) {
                toast.error("Failed to process image.");
                console.error(error);
            }
        }
    };

    const handleAvatarUpload = async () => {
        if (!crop || !imgRef.current) {
            toast.error("Please select and crop an image first.");
            return;
        }

        setUploading(true);
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            toast.error("Could not process image.");
            setUploading(false);
            return;
        }
        
        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob(async (blob) => {
            if (!blob) {
                toast.error("Could not create image from crop.");
                setUploading(false);
                return;
            }
            try {
                const croppedFile = new File([blob], `${uuidv4()}.png`, { type: 'image/png' });
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("User not found");

                const filePath = `${user.id}/${uuidv4()}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, croppedFile);
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);
                
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ avatar_url: publicUrl })
                    .eq('id', user.id);
                if (updateError) throw updateError;
                
                onUploadSuccess(publicUrl);
                toast.success("Avatar updated successfully!");
                setOpen(false);
                setImgSrc('');

            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unknown error occurred';
                toast.error(`Upload failed: ${message}`);
            } finally {
                setUploading(false);
            }
        }, 'image/png');
    };
    
    return (
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) setImgSrc(''); }}>
            <DialogTrigger asChild>
                <div className="relative group w-24 h-24 mx-auto cursor-pointer">
                    <Avatar className="h-full w-full border-2 border-muted">
                        <AvatarImage src={currentAvatarUrl || undefined} alt={`${username}'s avatar`} />
                        <AvatarFallback className="text-3xl">
                            {username ? username.charAt(0).toUpperCase() : '?'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Avatar</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Select Image</Button>
                    
                    {imgSrc && (
                        <div className="flex justify-center" style={{ maxHeight: '60vh' }}>
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                onComplete={(c) => setCrop(c)}
                                aspect={1}
                                circularCrop
                                minWidth={100}
                            >
                                <Image 
                                    ref={imgRef} 
                                    alt="Crop me" 
                                    src={imgSrc} 
                                    onLoad={onImageLoad} 
                                    width={800}
                                    height={800}
                                    style={{ objectFit: 'contain', maxHeight: '60vh', width: 'auto' }}
                                />
                            </ReactCrop>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleAvatarUpload} disabled={!crop || uploading}>
                        {uploading ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}