'use client'

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordForm() {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            toast.error(error.message);
        } else {
            setNewPassword('');
            toast.success("Password updated successfully!");
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                    id="newPassword" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="mt-2"
                />
            </div>
            <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
            </Button>
        </form>
    );
}