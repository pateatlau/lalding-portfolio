'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AdminStats } from '@/actions/admin';
import {
  Users,
  Download,
  TrendingUp,
  User,
  Briefcase,
  FolderOpen,
  Wrench,
  FileText,
  Eye,
} from 'lucide-react';

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

const quickActions = [
  {
    href: '/admin/profile',
    label: 'Profile',
    description: 'Edit personal info & about section',
    icon: User,
  },
  {
    href: '/admin/experience',
    label: 'Experience',
    description: 'Manage career timeline',
    icon: Briefcase,
  },
  {
    href: '/admin/projects',
    label: 'Projects',
    description: 'Manage portfolio projects',
    icon: FolderOpen,
  },
  {
    href: '/admin/skills',
    label: 'Skills',
    description: 'Edit skill groups & skills',
    icon: Wrench,
  },
  {
    href: '/admin/resume',
    label: 'Resume',
    description: 'Upload & manage resume',
    icon: FileText,
  },
  {
    href: '/admin/visitors',
    label: 'Visitors',
    description: 'View visitor profiles & downloads',
    icon: Eye,
  },
];

export default function DashboardContent({ stats }: { stats: AdminStats }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your portfolio activity</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisitors}</div>
            <p className="text-muted-foreground text-xs">Signed-in visitors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
            <p className="text-muted-foreground text-xs">Resume downloads all time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Downloads</CardTitle>
            <TrendingUp className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentDownloads}</div>
            <p className="text-muted-foreground text-xs">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent downloads table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Downloads</CardTitle>
          <CardDescription>Last 10 resume downloads</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentDownloadsList.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">No downloads yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Company</TableHead>
                  <TableHead>Downloaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentDownloadsList.map((download) => (
                  <TableRow key={download.id}>
                    <TableCell className="font-medium">
                      {download.visitorName ?? 'Unknown'}
                    </TableCell>
                    <TableCell>{download.visitorEmail ?? '—'}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {download.visitorCompany ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {timeAgo(download.downloadedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:bg-accent/50 transition-colors">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                    <action.icon className="text-primary size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{action.label}</CardTitle>
                    <CardDescription className="text-xs">{action.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
