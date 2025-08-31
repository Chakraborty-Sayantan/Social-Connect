import AuthForm from "@/components/auth/AuthForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-card text-card-foreground rounded-xl border shadow-lg z-10">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold">
            Welcome Back!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Please sign in to your account</p>
        </div>
        <AuthForm mode="login" />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:text-primary/80">
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );
}