import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PropsWithChildren } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AdminLayout({ children }: PropsWithChildren) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        redirect('/feed'); 
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-card border-b">
                <div className="container mx-auto flex justify-between items-center h-16 px-4">
                    <h1 className="text-xl font-bold">Admin Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <Link href="/feed" className="text-sm hover:underline">Back to App</Link>
                        <ThemeToggle />
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4">
                {children}
            </main>
        </div>
    );
}