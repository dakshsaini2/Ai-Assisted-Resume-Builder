import React from 'react';
import { Textarea } from '../common/Textarea';
import { Sparkles } from 'lucide-react';
import type { Resume } from '../../types';

interface SummaryFormProps {
  data: Partial<Resume>;
  onChange: (fields: Partial<Resume>) => void;
  onOpenAiSummary?: () => void;
}

export const SummaryForm: React.FC<SummaryFormProps> = ({
  data,
  onChange,
  onOpenAiSummary,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-charcoal">Professional Summary</h3>
          <p className="text-xs text-charcoal-light mt-0.5">
            Write a 2-4 sentence executive overview highlighting your top achievements and skills.
          </p>
        </div>
        {onOpenAiSummary && (
          <button
            type="button"
            onClick={onOpenAiSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-primary hover:bg-orange-100 text-xs font-semibold transition-colors cursor-pointer border border-orange-200/60"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate with AI</span>
          </button>
        )}
      </div>

      <Textarea
        rows={6}
        placeholder="e.g. Results-oriented Software Engineer with 3+ years of experience designing and deploying high-performance web applications using React, Node.js, and PostgreSQL..."
        value={data.summary || ''}
        onChange={(e) => onChange({ summary: e.target.value })}
        helperText="Tip: Keep it concise, focused on value delivered, and tailored to your target role."
      />
    </div>
  );
};

