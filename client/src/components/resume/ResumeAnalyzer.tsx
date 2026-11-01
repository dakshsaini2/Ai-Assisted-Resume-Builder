import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileCheck,
  RefreshCw,
  Search,
  AlertCircle,
  Wand2,
  Copy,
  Check,
  Save,
  Info,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { aiService, getAiErrorMessage } from '../../services/aiService';
import type { Resume, ResumeAnalysisRecord } from '../../types';

interface ResumeAnalyzerProps {
  resume: Resume;
  onRequireConsent: (action: () => void) => void;
  onSaveResume?: () => Promise<void>;
  isSaved?: boolean;
}

export const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({
  resume,
  onRequireConsent,
  onSaveResume,
  isSaved = true,
}) => {
  const [analysis, setAnalysis] = useState<ResumeAnalysisRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrievalId, setRetrievalId] = useState('');
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showRetrievalInput, setShowRetrievalInput] = useState(false);

  const executeAnalysis = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      setError(null);
      const record = await aiService.analyzeResume(resume.id);
      setAnalysis(record);
    } catch (err: unknown) {
      setError(getAiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAnalysis = () => {
    onRequireConsent(() => {
      executeAnalysis();
    });
  };

  const handleRetrieveAnalysis = async () => {
    if (isRetrieving) return;
    const trimmedId = retrievalId.trim();
    if (!trimmedId) {
      setError('Please enter a valid analysis ID.');
      return;
    }

    try {
      setIsRetrieving(true);
      setError(null);
      const record = await aiService.getResumeAnalysis(trimmedId);
      setAnalysis(record);
      setShowRetrievalInput(false);
    } catch (err: unknown) {
      setError(getAiErrorMessage(err));
    } finally {
      setIsRetrieving(false);
    }
  };

  const handleCopyId = (id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(id).catch(() => {});
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-primary bg-orange-50 border-orange-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 65) return 'bg-primary';
    return 'bg-amber-500';
  };

  const getScoreRating = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Strong';
    if (score >= 55) return 'Moderate';
    return 'Needs Attention';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>ATS Resume Analysis & Quality Scoring</span>
          </h2>
          <p className="text-xs text-charcoal-light mt-0.5">
            Objective evaluation of your resume content, section balance, and textual ATS readability conventions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRetrievalInput(!showRetrievalInput)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          >
            {showRetrievalInput ? 'Hide Lookup' : 'Lookup by ID'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleStartAnalysis}
            isLoading={isLoading}
            leftIcon={analysis ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          >
            {analysis ? 'Re-Analyze Resume' : 'Analyze Resume'}
          </Button>
        </div>
      </div>

      {!isSaved && (
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold mb-0.5 text-amber-950">
                Unsaved Editor Changes Detected
              </strong>
              <span>
                AI analysis evaluates your saved resume records. Save your latest changes before running an analysis so the evaluation reflects your newest edits.
              </span>
            </div>
          </div>
          {onSaveResume && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveResume}
              leftIcon={<Save className="w-3.5 h-3.5" />}
              className="shrink-0 bg-white hover:bg-amber-100"
            >
              Save Now
            </Button>
          )}
        </div>
      )}

      {showRetrievalInput && (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-3">
          <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
            Retrieve Past Analysis
          </h4>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Paste Analysis ID (UUID)"
              value={retrievalId}
              onChange={(e) => setRetrievalId(e.target.value)}
              className="text-xs font-mono"
            />
            <Button
              size="md"
              variant="secondary"
              onClick={handleRetrieveAnalysis}
              isLoading={isRetrieving}
              disabled={!retrievalId.trim()}
            >
              Retrieve
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold block mb-0.5">Analysis Notice</span>
            {error}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="p-12 text-center bg-orange-50/40 rounded-2xl border border-orange-200/60 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-primary flex items-center justify-center mx-auto animate-pulse">
            <Wand2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-charcoal">
              Analyzing Resume with Google Gemini
            </h3>
            <p className="text-xs text-charcoal-light mt-1 max-w-md mx-auto leading-relaxed">
              Evaluating evidence-based experience metrics, skill alignment, professional summary focus, and textual ATS readability conventions...
            </p>
          </div>
        </div>
      )}

      {!isLoading && !analysis && (
        <div className="p-10 rounded-2xl border-2 border-dashed border-gray-200 bg-white/60 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-primary mx-auto">
            <FileCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-charcoal">
              Ready to Analyze: {resume.title}
            </h3>
            <p className="text-xs text-charcoal-light max-w-md mx-auto leading-relaxed">
              Click &quot;Analyze Resume&quot; to generate an objective score breakdown, identify hidden gaps, and receive actionable suggestions. Results are securely saved to your account.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleStartAnalysis}
              isLoading={isLoading}
              disabled={isLoading}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Analyze Resume with AI
            </Button>
          </div>
        </div>
      )}

      {!isLoading && analysis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Overall Quality Score
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getScoreColor(
                    analysis.score
                  )}`}
                >
                  {getScoreRating(analysis.score)}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-charcoal tracking-tight">
                  {analysis.score}
                </span>
                <span className="text-sm font-medium text-gray-400">/ 100</span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getScoreProgressColor(
                    analysis.score
                  )}`}
                  style={{ width: `${analysis.score}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-3xs text-charcoal-light pt-1 border-t border-gray-100">
                <span>Saved Analysis ID: {analysis.id.slice(0, 8)}...</span>
                <button
                  type="button"
                  onClick={() => handleCopyId(analysis.id)}
                  className="inline-flex items-center gap-1 text-primary hover:text-primary-dark font-medium cursor-pointer"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Full ID</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  ATS Readability Score
                </span>
                <span className="text-3xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                  Textual Conventions
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-charcoal tracking-tight">
                  {analysis.results.atsFeedback.score}
                </span>
                <span className="text-sm font-medium text-gray-400">/ 100</span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getScoreProgressColor(
                    analysis.results.atsFeedback.score
                  )}`}
                  style={{ width: `${analysis.results.atsFeedback.score}%` }}
                />
              </div>

              <p className="text-xs text-charcoal-light line-clamp-2 leading-relaxed pt-1">
                {analysis.results.atsFeedback.readability}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
              Section Scores Breakdown
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(analysis.results.sectionScores).map(([section, score]) => (
                <div
                  key={section}
                  className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold capitalize text-charcoal">
                      {section}
                    </span>
                    <span className="text-xs font-bold text-charcoal">{score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${getScoreProgressColor(score)}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/70 space-y-3">
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Identified Strengths ({analysis.results.strengths.length})</span>
              </h4>
              <ul className="space-y-2">
                {analysis.results.strengths.map((str, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-emerald-950 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/70 space-y-3">
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Areas for Improvement ({analysis.results.weaknesses.length})</span>
              </h4>
              <ul className="space-y-2">
                {analysis.results.weaknesses.map((weak, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-amber-950 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-orange-50/30 border border-orange-200/70 space-y-3">
            <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span>Recommended Action Items</span>
            </h4>
            <ul className="space-y-2.5">
              {analysis.results.suggestions.map((sug, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-orange-100 text-xs text-charcoal flex items-start gap-2.5 shadow-2xs leading-relaxed"
                >
                  <span className="px-1.5 py-0.5 rounded bg-orange-100 text-primary font-bold text-3xs shrink-0 mt-0.5">
                    #{idx + 1}
                  </span>
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Textual ATS Formatting Guidance</span>
              </h4>
              <span className="text-3xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                Structure & Keyword Conventions
              </span>
            </div>

            {analysis.results.atsFeedback.formattingSuggestions.length > 0 ? (
              <ul className="space-y-2">
                {analysis.results.atsFeedback.formattingSuggestions.map((fmt, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-charcoal-light flex items-start gap-2 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>{fmt}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                No structural formatting issues identified in standard resume sections.
              </p>
            )}

            <div className="mt-4 p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-start gap-2.5 text-xs text-charcoal-light leading-relaxed">
              <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-charcoal font-semibold mb-0.5">
                  Assessment Disclaimer
                </strong>
                <span>{analysis.results.atsFeedback.disclaimer}</span>
                <span className="block mt-1 text-3xs text-gray-400">
                  Note: Analysis is evaluated from structured database text records, not rendered visual PDF pixels or graphic margins.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
