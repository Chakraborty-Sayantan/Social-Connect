import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PropsWithChildren } from "react";

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
        // Or redirect to a dedicated "unauthorized" page
        redirect('/feed'); 
    }

    return (
        <div>
            <header className="bg-gray-800 text-white p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">Admin Dashboard</h1>
                     <Link href="/feed" className="text-sm hover:underline">Back to App</Link>
                </div>
            </header>
            <main className="container mx-auto p-4">
                {children}
            </main>
        </div>
    );
}