'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Trash2, CheckCircle2, ArrowRight } from 'lucide-react';
import { analyzeJobDescription, clearJdAnalysis } from '@/actions/resume-builder';
import type { JdAnalysisResult, JdSuggestion } from '@/lib/supabase/types';

type JdOptimizerProps = {
  configId: string;
  initialJobDescription: string | null;
  initialKeywords: string[] | null;
  initialCoverageScore: number | null;
  initialAnalysis: JdAnalysisResult | null;
  onSuggestionsApplied: (suggestions: JdSuggestion[]) => void;
};

type StatusMessage = { type: 'success' | 'error'; message: string } | null;

export default function JdOptimizer({
  configId,
  initialJobDescription,
  initialKeywords,
  initialCoverageScore,
  initialAnalysis,
  onSuggestionsApplied,
}: JdOptimizerProps) {
  const [jobDescription, setJobDescription] = useState(initialJobDescription ?? '');
  const [keywords, setKeywords] = useState<string[] | null>(initialKeywords);
  const [coverageScore, setCoverageScore] = useState<number | null>(initialCoverageScore);
  const [analysis, setAnalysis] = useState<JdAnalysisResult | null>(initialAnalysis);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [appliedSuggestionIds, setAppliedSuggestionIds] = useState<Set<string>>(new Set());

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setStatus(null);

    try {
      const result = await analyzeJobDescription(configId, jobDescription);

      if (result.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }

      if (result.data) {
        setKeywords(result.data.keywords);
        setCoverageScore(result.data.coverageScore);
        setAnalysis(result.data.analysis);
        setAppliedSuggestionIds(new Set());
        setStatus({ type: 'success', message: 'Analysis complete' });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Analysis failed',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleClear() {
    setIsClearing(true);
    setStatus(null);

    try {
      const result = await clearJdAnalysis(configId);

      if (result.error) {
        setStatus({ type: 'error', message: result.error });
        return;
      }

      setJobDescription('');
      setKeywords(null);
      setCoverageScore(null);
      setAnalysis(null);
      setAppliedSuggestionIds(new Set());
      setStatus({ type: 'success', message: 'Analysis cleared' });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to clear analysis',
      });
    } finally {
      setIsClearing(false);
    }
  }

  function handleApplySuggestion(suggestion: JdSuggestion) {
    onSuggestionsApplied([suggestion]);
    setAppliedSuggestionIds((prev) => {
      const next = new Set(prev);
      next.add(suggestion.itemId);
      return next;
    });
  }

  function handleApplyAll() {
    if (!analysis) return;
    const unapplied = analysis.suggestions.filter((s) => !appliedSuggestionIds.has(s.itemId));
    if (unapplied.length === 0) return;
    onSuggestionsApplied(unapplied);
    setAppliedSuggestionIds((prev) => {
      const next = new Set(prev);
      for (const s of unapplied) next.add(s.itemId);
      return next;
    });
  }

  const hasAnalysis = analysis !== null && coverageScore !== null;
  const scorePercent = coverageScore !== null ? Math.round(coverageScore * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" />
          JD Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Job Description Input */}
        <div className="space-y-2">
          <Textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste a job description to analyze keyword coverage..."
            rows={6}
            disabled={isAnalyzing}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !jobDescription.trim()}
            >
              {isAnalyzing ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1 size-4" />
              )}
              Analyze
            </Button>
            {hasAnalysis && (
              <Button size="sm" variant="outline" onClick={handleClear} disabled={isClearing}>
                {isClearing ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-1 size-4" />
                )}
                Clear Analysis
              </Button>
            )}
          </div>
        </div>

        {status && (
          <p
            className={`text-sm ${status.type === 'error' ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}
          >
            {status.message}
          </p>
        )}

        {/* Analysis Results */}
        {hasAnalysis && (
          <div className="space-y-4">
            {/* Coverage Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Keyword Coverage</span>
                <span
                  className={`font-semibold ${
                    scorePercent >= 75
                      ? 'text-green-600 dark:text-green-400'
                      : scorePercent >= 50
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {`${scorePercent}%`}
                </span>
              </div>
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${
                    scorePercent >= 75
                      ? 'bg-green-500'
                      : scorePercent >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
            </div>

            {/* Keywords */}
            {keywords && keywords.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Keywords ({analysis!.matchedKeywords.length} matched,{' '}
                  {analysis!.missingKeywords.length} missing)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis!.matchedKeywords.map((kw) => (
                    <Badge
                      key={`matched-${kw}`}
                      variant="outline"
                      className="border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300"
                    >
                      {kw}
                    </Badge>
                  ))}
                  {analysis!.missingKeywords.map((kw) => (
                    <Badge
                      key={`missing-${kw}`}
                      variant="outline"
                      className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {analysis!.suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Suggestions ({analysis!.suggestions.length})
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleApplyAll}
                    disabled={analysis!.suggestions.every((s) =>
                      appliedSuggestionIds.has(s.itemId)
                    )}
                  >
                    Apply All
                  </Button>
                </div>
                <div className="space-y-2">
                  {analysis!.suggestions.map((suggestion) => {
                    const isApplied = appliedSuggestionIds.has(suggestion.itemId);
                    return (
                      <div
                        key={suggestion.itemId}
                        className={`flex items-start justify-between gap-2 rounded-md border p-3 text-sm ${
                          isApplied
                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                            : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <Badge variant="secondary" className="mb-1 text-xs">
                            {formatSuggestionType(suggestion.type)}
                          </Badge>
                          <p className="text-muted-foreground text-xs">{suggestion.reason}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={isApplied ? 'ghost' : 'outline'}
                          className="shrink-0"
                          onClick={() => handleApplySuggestion(suggestion)}
                          disabled={isApplied}
                        >
                          {isApplied ? (
                            <CheckCircle2 className="mr-1 size-3.5 text-green-600" />
                          ) : (
                            <ArrowRight className="mr-1 size-3.5" />
                          )}
                          {isApplied ? 'Applied' : 'Apply'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatSuggestionType(type: JdSuggestion['type']): string {
  switch (type) {
    case 'include_experience':
      return 'Include Experience';
    case 'include_project':
      return 'Include Project';
    case 'include_skill_group':
      return 'Include Skill Group';
    case 'emphasize':
      return 'Emphasize';
  }
}
