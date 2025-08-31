import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
        <Image 
            src="/logo.jpeg"
            alt="SocialConnect Logo"
            width={100}
            height={100}
            className="rounded-full object-cover mb-8"
        />
      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        404 - Page Not Found
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Sorry, the page or user you are looking for does not exist or is private.
      </p>
      <Button asChild className="mt-8">
        <Link href="/feed">Go back to Feed</Link>
      </Button>
    </div>
  );
}