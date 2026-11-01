import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Textarea } from '../common/Textarea';
import { Sparkles, RefreshCw, AlertTriangle, Check, ArrowLeft, Wand2, Lightbulb } from 'lucide-react';
import { aiService, getAiErrorMessage } from '../../services/aiService';
import type { ImproveTone, ImproveResponseData } from '../../types';

interface AiImproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  onApply: (improvedText: string) => void;
}

const TONE_OPTIONS: { value: ImproveTone; label: string; description: string }[] = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Clean, direct phrasing starting with strong action verbs',
  },
  {
    value: 'impactful',
    label: 'Impactful',
    description: 'Maximizes business value, leadership agency, and outcome visibility',
  },
  {
    value: 'technical',
    label: 'Technical',
    description: 'Highlights technical implementation, architecture, and engineering depth',
  },
  {
    value: 'executive',
    label: 'Executive',
    description: 'High-level ownership, team leadership, and cross-functional scale',
  },
];

export const AiImproveModal: React.FC<AiImproveModalProps> = ({
  isOpen,
  onClose,
  originalText,
  onApply,
}) => {
  const [tone, setTone] = useState<ImproveTone>('professional');
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImproveResponseData | null>(null);
  const [editableText, setEditableText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setResult(null);
      setEditableText('');
      setInstructions('');
    }
  }, [isOpen, originalText]);

  const handleImprove = async () => {
    const trimmed = originalText.trim();
    if (!trimmed || trimmed.length < 5) {
      setError('Original bullet text must be at least 5 characters long to improve.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await aiService.improveResumeContent(trimmed, {
        tone,
        instructions: instructions.trim() || undefined,
      });

      setResult(response);
      setEditableText(response.improvedText);
    } catch (err: unknown) {
      setError(getAiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAndApply = () => {
    if (!editableText.trim()) {
      setError('Improved text cannot be empty.');
      return;
    }
    onApply(editableText.trim());
    onClose();
  };

  const handleBackToOptions = () => {
    setResult(null);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Improve Resume Bullet with AI"
      description={
        result
          ? 'Review the polished bullet point and compare with your original text.'
          : 'Elevate action verbs and clarity while strictly preserving your factual background.'
      }
      size="lg"
      footer={
        result ? (
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToOptions}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Adjust Prompt
            </Button>
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImprove}
                isLoading={isLoading}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Regenerate
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAcceptAndApply}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Accept & Apply
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleImprove}
              isLoading={isLoading}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Improve with AI
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold block mb-0.5">Improvement Notice</span>
              {error}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="p-8 text-center bg-orange-50/40 rounded-xl border border-orange-200/60 space-y-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 text-primary flex items-center justify-center mx-auto animate-pulse">
              <Wand2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-charcoal">
                Optimizing Bullet Point
              </p>
              <p className="text-xs text-charcoal-light mt-1">
                Refining action verbs and phrasing with Google Gemini...
              </p>
            </div>
          </div>
        )}

        {!isLoading && result && (
          <div className="space-y-4">
            {result.explanation && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/70 flex items-start gap-2.5 text-xs text-amber-900">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold block mb-0.5 text-amber-950">
                    Why this was improved:
                  </span>
                  {result.explanation}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Original Source
                </span>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 leading-relaxed min-h-[120px] whitespace-pre-wrap">
                  {originalText}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-semibold text-primary uppercase tracking-wider">
                    AI Improved (Editable)
                  </span>
                  <span className="text-3xs px-1.5 py-0.5 rounded bg-orange-100 text-primary font-bold">
                    Tone: {tone}
                  </span>
                </div>
                <Textarea
                  rows={5}
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  className="text-xs"
                  helperText="You can edit this draft before applying. Factual claims must originate from your experience."
                />
              </div>
            </div>
          </div>
        )}

        {!isLoading && !result && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider">
                Current Bullet Point
              </label>
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-charcoal leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                {originalText}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Desired Tone & Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TONE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTone(opt.value)}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      tone === opt.value
                        ? 'border-primary bg-orange-50/50 shadow-2xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-charcoal">
                        {opt.label}
                      </span>
                      {tone === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-charcoal-light mt-0.5 line-clamp-2">
                      {opt.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Additional Guidance (Optional)"
              placeholder="e.g. Focus on microservices architecture and make the action verb more prominent..."
              value={instructions}
              maxLength={300}
              rows={2}
              onChange={(e) => setInstructions(e.target.value)}
              helperText="Optional specific guidance (max 300 characters). Note: AI cannot invent new metrics or tools not present in the original."
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
