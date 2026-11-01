import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { Resume } from '../types';
import { ClassicTemplate, ModernTemplate, CreativeTemplate } from '../components/templates';
import { getResumeRenderData } from '../services/resumeService';

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
        const loadedResume = await getResumeRenderData(id, token);

        if (!isMounted) return;

        setResume(loadedResume);

        if ('fonts' in document) {
          await (document as any).fonts.ready;
        }

        await new Promise((resolve) => setTimeout(resolve, 50));

        if (isMounted) {
          setStatus('ready');
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          const msg =
            err.response?.data?.message ||
            err.message ||
            'An unexpected error occurred while loading resume.';
          setErrorMessage(msg);
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

