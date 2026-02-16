'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FaGoogle, FaGithub, FaLinkedin } from 'react-icons/fa';
import { Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  // Auto-redirect if already admin
  useEffect(() => {
    if (!isLoading && user?.app_metadata?.role === 'admin') {
      router.replace('/admin');
    }
  }, [user, isLoading, router]);

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    // Verify admin role after login
    const {
      data: { user: loggedInUser },
    } = await supabase.auth.getUser();
    if (loggedInUser?.app_metadata?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Access denied. Admin privileges required.');
      setIsSubmitting(false);
      return;
    }

    router.replace('/admin');
  };

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'linkedin_oidc') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="bg-background fixed inset-0 z-[1000] flex items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background fixed inset-0 z-[1000] flex items-center justify-center">
      <Card className="mx-4 w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
            <ShieldCheck className="text-primary size-6" />
          </div>
          <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
          <CardDescription>Sign in to manage your portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="relative my-6">
            <Separator />
            <span className="text-muted-foreground bg-card absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
              Or continue with
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin('google')}
              aria-label="Sign in with Google"
            >
              <FaGoogle />
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin('github')}
              aria-label="Sign in with GitHub"
            >
              <FaGithub />
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin('linkedin_oidc')}
              aria-label="Sign in with LinkedIn"
            >
              <FaLinkedin />
            </Button>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-sm transition"
            >
              Back to portfolio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
