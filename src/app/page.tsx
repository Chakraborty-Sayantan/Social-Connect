import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full flex flex-col items-center">
        <Image 
            src="/logo.jpeg" 
            alt="SocialConnect Logo"
            width={150}
            height={150}
            priority
            className="rounded-full object-cover"
        />
        <h1 className="text-4xl font-bold tracking-tight text-foreground mt-6">
          Welcome to Social Connect
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Connect with friends, share your moments, and discover new content.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}