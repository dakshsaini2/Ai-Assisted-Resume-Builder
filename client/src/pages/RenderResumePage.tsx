import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { Resume } from '../types';
import { ClassicTemplate, ModernTemplate, CreativeTemplate } from '../components/templates';

type RenderStatus = 'loading' | 'ready' | 'error';

export const RenderResumePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<RenderStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchResumeAndPrepare = async () => {
      if (!id || !token) {
        setStatus('error');
        setErrorMessage('Missing resume ID or authorization token.');
        return;
      }

      try {
        const response = await fetch(
          `/api/resumes/${id}/render-data?token=${encodeURIComponent(token)}`
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          const msg =
            errData?.message || `Failed to fetch resume (HTTP ${response.status})`;
          if (isMounted) {
            setStatus('error');
            setErrorMessage(msg);
          }
          return;
        }

        const json = await response.json();
        const loadedResume: Resume = json.data?.resume;

        if (!loadedResume) {
          if (isMounted) {
            setStatus('error');
            setErrorMessage('Resume data not found in response.');
          }
          return;
        }

        if (isMounted) {
          setResume(loadedResume);
        }

        // Wait for all web fonts and typography to complete rasterization
        if ('fonts' in document) {
          await (document as any).fonts.ready;
        }

        // Short frame delay to allow browser paint to settle
        await new Promise((resolve) => setTimeout(resolve, 50));

        if (isMounted) {
          setStatus('ready');
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err.message || 'An unexpected error occurred while loading resume.');
        }
      }
    };

    fetchResumeAndPrepare();

    return () => {
      isMounted = false;
    };
  }, [id, token]);

  const renderTemplate = (res: Resume) => {
    switch (res.templateId) {
      case 'classic':
        return <ClassicTemplate resume={res} />;
      case 'creative':
        return <CreativeTemplate resume={res} />;
      case 'modern':
      default:
        return <ModernTemplate resume={res} />;
    }
  };

  return (
    <div
      id="resume-ready"
      data-status={status}
      className="bg-white min-h-screen w-full flex flex-col items-center justify-start m-0 p-0"
      style={{ backgroundColor: '#ffffff' }}
    >
      {status === 'loading' && (
        <div className="p-8 text-center text-gray-500 font-sans text-sm">
          Preparing resume for PDF generation...
        </div>
      )}

      {status === 'error' && (
        <div className="p-8 max-w-lg text-center font-sans">
          <div className="text-red-600 font-semibold mb-2">Render Error</div>
          <div className="text-gray-700 text-sm bg-red-50 p-4 rounded-lg border border-red-200">
            {errorMessage}
          </div>
        </div>
      )}

      {status === 'ready' && resume && (
        <div className="resume-print-wrapper w-[210mm] mx-auto bg-white">
          {renderTemplate(resume)}
        </div>
      )}
    </div>
  );
};
