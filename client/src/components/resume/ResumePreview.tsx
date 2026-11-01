import React, { useState, useRef, useEffect } from 'react';
import { Printer, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { Resume } from '../../types';
import { ClassicTemplate, ModernTemplate, CreativeTemplate } from '../templates';

interface ResumePreviewProps {
  resume: Partial<Resume>;
  onTemplateChange?: (templateId: 'classic' | 'modern' | 'creative') => void;
  showToolbar?: boolean;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  resume,
  onTemplateChange,
  showToolbar = true,
}) => {
  const [zoom, setZoom] = useState<number>(0.85);
  const [estimatedPages, setEstimatedPages] = useState<number>(1);
  const documentRef = useRef<HTMLDivElement>(null);

  const templateId = resume.templateId || 'modern';

  useEffect(() => {
    if (documentRef.current) {
      const height = documentRef.current.scrollHeight;
      const pages = Math.max(1, Math.ceil(height / 1120));
      setEstimatedPages(pages);
    }
  }, [resume, zoom]);

  const handlePrint = () => {
    window.print();
  };

  const renderTemplate = () => {
    switch (templateId) {
      case 'classic':
        return <ClassicTemplate resume={resume} />;
      case 'creative':
        return <CreativeTemplate resume={resume} />;
      case 'modern':
      default:
        return <ModernTemplate resume={resume} />;
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {showToolbar && (
        <div className="no-print sticky top-0 z-20 w-full mb-4 px-4 py-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {onTemplateChange ? (
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs">
              {(['classic', 'modern', 'creative'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTemplateChange(t)}
                  className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all cursor-pointer ${
                    templateId === t
                      ? 'bg-white text-charcoal font-semibold shadow-2xs'
                      : 'text-gray-500 hover:text-charcoal'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {templateId} Template
            </span>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">
              ~{estimatedPages} {estimatedPages === 1 ? 'page' : 'pages'}
            </span>

            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10))}
                className="p-1 text-gray-500 hover:text-charcoal hover:bg-gray-100 rounded cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] font-semibold text-gray-700 w-10 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(1.5, Math.round((prev + 0.1) * 10) / 10))}
                className="p-1 text-gray-500 hover:text-charcoal hover:bg-gray-100 rounded cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setZoom(0.85)}
                className="p-1 text-gray-400 hover:text-charcoal rounded cursor-pointer ml-0.5"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal text-white hover:bg-charcoal-light text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center overflow-x-auto pb-8 print:block print:p-0 print:m-0 print:overflow-visible">
        <div
          className="resume-print-wrapper transition-transform duration-150 origin-top shadow-xl border border-gray-200/80 rounded-sm print:shadow-none print:border-none"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            marginBottom: `${(zoom - 1) * 1000}px`,
          }}
          ref={documentRef}
        >
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
};
