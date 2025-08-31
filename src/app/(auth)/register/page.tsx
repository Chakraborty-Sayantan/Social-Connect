import AuthForm from "@/components/auth/AuthForm";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-card text-card-foreground rounded-xl border shadow-lg z-10">
        <div className="text-center">
            <div className="flex justify-center mb-6">
                <Image 
                    src="/logo.jpeg"
                    alt="SocialConnect Logo"
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                    priority
                />
            </div>
          <h2 className="mt-6 text-3xl font-bold">
            Join Social Connect
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Create an account to get started</p>
        </div>
        <AuthForm mode="register" />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:text-primary/80">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}