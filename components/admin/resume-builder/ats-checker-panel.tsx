'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Info,
} from 'lucide-react';
import { runAtsCheck } from '@/actions/resume-builder';
import type { ResumeConfig } from '@/lib/supabase/types';
import type {
  AtsCheckResult,
  AtsCheckCategory,
  AtsCategorySummary,
  AtsCheck,
} from '@/lib/resume-builder/ats-checker';

type AtsCheckerPanelProps = {
  config: ResumeConfig;
};

type StatusMessage = { type: 'success' | 'error'; message: string } | null;

export default function AtsCheckerPanel({ config }: AtsCheckerPanelProps) {
  const [result, setResult] = useState<AtsCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<AtsCheckCategory>>(new Set());

  async function handleRunCheck() {
    setIsChecking(true);
    setStatus(null);

    try {
      const response = await runAtsCheck(config.id);

      if (response.error) {
        setStatus({ type: 'error', message: response.error });
        return;
      }

      if (response.data) {
        setResult(response.data);
        // Auto-expand categories with failures or warnings
        const toExpand = new Set<AtsCheckCategory>();
        for (const cat of response.data.categories) {
          if (cat.failed > 0 || cat.warned > 0) {
            toExpand.add(cat.category);
          }
        }
        setExpandedCategories(toExpand);
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'ATS check failed',
      });
    } finally {
      setIsChecking(false);
    }
  }

  function toggleCategory(category: AtsCheckCategory) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  const hasJdAnalysis = config.jd_analysis !== null;

  return (
    <div className="space-y-4">
      {/* Run button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleRunCheck} disabled={isChecking}>
          {isChecking ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <ShieldCheck className="mr-2 size-4" />
          )}
          Run ATS Check
        </Button>
        {result && (
          <span className="text-muted-foreground text-xs">
            Last checked: {new Date(result.checkedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {status && (
        <p
          className={`text-sm ${status.type === 'error' ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}
        >
          {status.message}
        </p>
      )}

      {/* Keyword checks notice */}
      {!hasJdAnalysis && (
        <div className="text-muted-foreground flex items-start gap-2 rounded-md border p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>Run JD analysis in the Composer tab to unlock keyword optimization checks.</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Score + summary bar */}
          <Card>
            <CardContent className="flex items-center gap-6 pt-6">
              {/* Score */}
              <div className="flex flex-col items-center">
                <span
                  className={`text-4xl font-bold ${
                    result.score >= 80
                      ? 'text-green-600 dark:text-green-400'
                      : result.score >= 60
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}
                  data-testid="ats-score"
                >
                  {result.score}%
                </span>
                <span className="text-muted-foreground text-xs">ATS Score</span>
              </div>

              {/* Summary badges */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300"
                >
                  <CheckCircle2 className="mr-1 size-3" />
                  {result.totalPassed} passed
                </Badge>
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
                >
                  <AlertTriangle className="mr-1 size-3" />
                  {result.totalWarned} warnings
                </Badge>
                <Badge
                  variant="outline"
                  className="border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300"
                >
                  <XCircle className="mr-1 size-3" />
                  {result.totalFailed} failed
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Category cards */}
          {result.categories.map((cat) => (
            <CategoryCard
              key={cat.category}
              summary={cat}
              expanded={expandedCategories.has(cat.category)}
              onToggle={() => toggleCategory(cat.category)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Category Card ─────────────────────────────────────────────────

function CategoryCard({
  summary,
  expanded,
  onToggle,
}: {
  summary: AtsCategorySummary;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusIcon =
    summary.failed > 0 ? (
      <XCircle className="size-4 text-red-500" />
    ) : summary.warned > 0 ? (
      <AlertTriangle className="size-4 text-amber-500" />
    ) : (
      <CheckCircle2 className="size-4 text-green-500" />
    );

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={onToggle}
        role="button"
        aria-expanded={expanded}
        aria-label={`${summary.label} category`}
      >
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            {statusIcon}
            {summary.label}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs font-normal">
              {summary.passed}/{summary.total} passed
            </span>
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </span>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-2 pt-0">
          {summary.checks.map((check) => (
            <CheckItem key={check.id} check={check} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// ── Check Item ────────────────────────────────────────────────────

function CheckItem({ check }: { check: AtsCheck }) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const icon =
    check.status === 'pass' ? (
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
    ) : check.status === 'warning' ? (
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
    ) : (
      <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
    );

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start gap-2">
        {icon}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{check.name}</span>
            <Badge
              variant="outline"
              className={`text-xs ${
                check.status === 'pass'
                  ? 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-300'
                  : check.status === 'warning'
                    ? 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300'
                    : 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-300'
              }`}
            >
              {check.id}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">{check.message}</p>

          {check.details && check.details.length > 0 && (
            <button
              className="text-muted-foreground mt-1 text-xs underline hover:no-underline"
              onClick={() => setDetailsExpanded(!detailsExpanded)}
            >
              {detailsExpanded ? 'Hide details' : `Show details (${check.details.length})`}
            </button>
          )}

          {detailsExpanded && check.details && (
            <ul className="text-muted-foreground mt-1 list-disc space-y-0.5 pl-4 text-xs">
              {check.details.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
