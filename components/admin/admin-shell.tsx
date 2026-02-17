'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  User,
  Briefcase,
  FolderOpen,
  Wrench,
  FileText,
  FileCog,
  GraduationCap,
  Users,
  LogOut,
  Menu,
  ChevronRight,
} from 'lucide-react';
import SentryFeedback from '@/components/admin/sentry-feedback';

type AdminShellProps = {
  adminUser: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  children: React.ReactNode;
};

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/profile', label: 'Profile', icon: User },
  { href: '/admin/experience', label: 'Experience', icon: Briefcase },
  { href: '/admin/education', label: 'Education', icon: GraduationCap },
  { href: '/admin/projects', label: 'Projects', icon: FolderOpen },
  { href: '/admin/skills', label: 'Skills', icon: Wrench },
  { href: '/admin/resume', label: 'Resume', icon: FileText },
  { href: '/admin/resume-builder', label: 'Resume Builder', icon: FileCog },
  { href: '/admin/visitors', label: 'Visitors', icon: Users },
];

function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split('/').filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return { href, label };
  });

  return (
    <div className="flex items-center gap-1 text-sm">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.href}>
          {index > 0 && <ChevronRight className="text-muted-foreground size-3" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-muted-foreground hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function AdminShell({ adminUser, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  const sidebarContent = (
    <nav className="flex flex-col gap-1 p-4">
      <div className="mb-6 px-2">
        <h2 className="text-lg font-semibold">Admin</h2>
        <p className="text-muted-foreground text-xs">lalding.in</p>
      </div>
      <Separator className="mb-4" />
      {navItems.map((item) => {
        const isActive =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="bg-card hidden border-r md:flex md:w-60 md:flex-col">
        {sidebarContent}
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-card flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger — rendered client-only to avoid Radix ID hydration mismatch */}
            {mounted && (
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-60 p-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  {sidebarContent}
                </SheetContent>
              </Sheet>
            )}
            <Breadcrumbs pathname={pathname} />
          </div>

          {/* Admin info + sign out */}
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              {adminUser.avatarUrl ? (
                <Image
                  src={adminUser.avatarUrl}
                  alt={adminUser.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <AvatarFallback className="text-xs">
                  {adminUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="hidden text-sm font-medium sm:block">{adminUser.name}</span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>

        <SentryFeedback />
      </div>
    </>
  );
}
