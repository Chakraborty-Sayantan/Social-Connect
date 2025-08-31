import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full">
        <h1 className="text-6xl font-bold tracking-tight text-foreground">
          Welcome to Social Connect
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
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