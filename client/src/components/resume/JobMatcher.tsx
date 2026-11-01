import React, { useState } from 'react';
import {
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Search,
  Copy,
  Check,
  Wand2,
  HelpCircle,
  Tag,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { aiService, getAiErrorMessage } from '../../services/aiService';
import type { Resume, JobMatchRecord } from '../../types';

interface JobMatcherProps {
  resume: Resume;
  onRequireConsent: (action: () => void) => void;
}

export const JobMatcher: React.FC<JobMatcherProps> = ({
  resume,
  onRequireConsent,
}) => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [matchResult, setMatchResult] = useState<JobMatchRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrievalId, setRetrievalId] = useState('');
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [showRetrievalInput, setShowRetrievalInput] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const descLength = jobDescription.trim().length;
  const isDescValid = descLength >= 20 && descLength <= 8000;

  const executeMatch = async () => {
    if (isLoading) return;
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      setError('Job description must be at least 20 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const record = await aiService.matchJobDescription({
        resumeId: resume.id,
        jobTitle: jobTitle.trim() || undefined,
        jobDescription: jobDescription.trim(),
      });

      setMatchResult(record);
    } catch (err: unknown) {
      setError(getAiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMatch = () => {
    onRequireConsent(() => {
      executeMatch();
    });
  };

  const handleRetrieveMatch = async () => {
    if (isRetrieving) return;
    const trimmedId = retrievalId.trim();
    if (!trimmedId) {
      setError('Please enter a valid match ID.');
      return;
    }

    try {
      setIsRetrieving(true);
      setError(null);
      const record = await aiService.getJobMatch(trimmedId);
      setMatchResult(record);
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
    if (score >= 60) return 'text-primary bg-orange-50 border-orange-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-primary';
    return 'bg-amber-500';
  };

  const getScoreRating = (score: number) => {
    if (score >= 80) return 'Strong Alignment';
    if (score >= 60) return 'Moderate Match';
    return 'Low Match';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <span>Job Description Matcher & Keyword Gap Analysis</span>
          </h2>
          <p className="text-xs text-charcoal-light mt-0.5">
            Compare your resume evidence directly against any target job description to evaluate role fit and keyword alignment.
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

          {matchResult && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMatchResult(null);
                setError(null);
              }}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              New Job Match
            </Button>
          )}
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-200/60 flex items-center justify-between text-xs text-charcoal">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary shrink-0" />
          <span>
            Target Resume: <strong>{resume.title}</strong>
            {resume.fullName ? ` (${resume.fullName})` : ''}
          </span>
        </div>
        <span className="text-3xs px-2 py-0.5 rounded bg-white font-mono text-gray-500 border border-gray-200">
          Template: {resume.templateId}
        </span>
      </div>

      {showRetrievalInput && (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-3">
          <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
            Retrieve Past Job Match
          </h4>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Paste Job Match ID (UUID)"
              value={retrievalId}
              onChange={(e) => setRetrievalId(e.target.value)}
              className="text-xs font-mono"
            />
            <Button
              size="md"
              variant="secondary"
              onClick={handleRetrieveMatch}
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
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold block mb-0.5">Matching Notice</span>
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
              Evaluating Role Alignment with Google Gemini
            </h3>
            <p className="text-xs text-charcoal-light mt-1 max-w-md mx-auto leading-relaxed">
              Comparing job requirements against your verified resume evidence, identifying keyword coverage, and extracting skills not found in your current text...
            </p>
          </div>
        </div>
      )}

      {!isLoading && !matchResult && (
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
          <Input
            label="Target Job Title (Optional)"
            placeholder="e.g. Senior Backend Engineer, Lead DevOps Specialist"
            value={jobTitle}
            maxLength={150}
            onChange={(e) => setJobTitle(e.target.value)}
            helperText="Specifying a title helps the AI contextualize role seniority and expectations."
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-charcoal">
                Job Description & Requirements <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-3xs ${
                  descLength > 8000
                    ? 'text-red-600 font-bold'
                    : descLength < 20
                    ? 'text-gray-400'
                    : 'text-emerald-600 font-medium'
                }`}
              >
                {descLength} / 8,000 characters (min 20)
              </span>
            </div>

            <Textarea
              rows={8}
              placeholder="Paste the target job posting here, including required skills, technical qualifications, and day-to-day responsibilities..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              helperText="Paste the complete job posting. Factual matching is strictly performed against your resume evidence."
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleStartMatch}
              disabled={!isDescValid || isLoading}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Evaluate Job Match
            </Button>
          </div>
        </div>
      )}

      {!isLoading && matchResult && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Match Score vs. Requirements
                </span>
                <h3 className="text-base font-bold text-charcoal mt-0.5">
                  {matchResult.jobTitle || 'Target Role'}
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${getScoreColor(
                  matchResult.matchScore
                )}`}
              >
                {getScoreRating(matchResult.matchScore)}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-charcoal tracking-tight">
                {matchResult.matchScore}
              </span>
              <span className="text-sm font-medium text-gray-400">/ 100</span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${getScoreProgressColor(
                  matchResult.matchScore
                )}`}
                style={{ width: `${matchResult.matchScore}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-3xs text-charcoal-light pt-2 border-t border-gray-100">
              <span>Saved Match ID: {matchResult.id.slice(0, 8)}...</span>
              <button
                type="button"
                onClick={() => handleCopyId(matchResult.id)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Matching Skills ({matchResult.results.matchingSkills.length})</span>
                </h4>
                <span className="text-3xs text-emerald-700 font-medium">Found in Resume</span>
              </div>

              {matchResult.results.matchingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {matchResult.results.matchingSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-medium text-emerald-900 shadow-2xs"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No direct skill matches identified.</p>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-gray-500" />
                  <span>
                    Skills Not Found in Resume ({matchResult.results.skillsNotFoundInResume.length})
                  </span>
                </h4>
                <span className="text-3xs text-gray-500 font-medium">Unmentioned</span>
              </div>

              {matchResult.results.skillsNotFoundInResume.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {matchResult.results.skillsNotFoundInResume.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-charcoal shadow-2xs"
                    >
                      <Tag className="w-3 h-3 text-gray-400" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-700 italic">
                  All key technical skills in the job description were identified in your resume!
                </p>
              )}

              <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-3xs text-amber-950 leading-relaxed flex items-start gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Note on Unmentioned Skills:</strong> These skills appear in the job requirements but were not found in your supplied resume text. This does <em>not</em> imply you lack these competencies—only that they are not explicitly documented. If you possess experience with them, consider adding them to your skills or experience sections.
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
              Keyword Density & ATS Vocabulary Comparison
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Matching Keywords ({matchResult.results.matchingKeywords.length})</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.results.matchingKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-100 text-3xs font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <span>Missing Keywords ({matchResult.results.missingKeywords.length})</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.results.missingKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-gray-100 text-charcoal-light border border-gray-200 text-3xs font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Alignment Strengths</span>
              </h4>
              <ul className="space-y-2">
                {matchResult.results.strengths.map((str, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-charcoal-light flex items-start gap-2 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span>Tailoring Recommendations</span>
              </h4>
              <ul className="space-y-2">
                {matchResult.results.improvementSuggestions.map((sug, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-charcoal-light flex items-start gap-2 leading-relaxed"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
