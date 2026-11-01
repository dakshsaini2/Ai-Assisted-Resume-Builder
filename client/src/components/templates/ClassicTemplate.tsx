import React from 'react';
import type { Resume } from '../../types';
import { formatDateRange, parseBulletPoints, formatUrlForDisplay } from '../../utils/formatters';

interface ClassicTemplateProps {
  resume: Partial<Resume>;
}

export const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ resume }) => {
  const {
    fullName,
    email,
    phone,
    location,
    linkedin,
    github,
    website,
    summary,
    education = [],
    experiences = [],
    projects = [],
    skills = [],
    certifications = [],
    achievements = [],
    languages = [],
  } = resume;

  const validEducation = education.filter((e) => e.institution?.trim() || e.degree?.trim());
  const validExperience = experiences.filter((e) => e.company?.trim() || e.position?.trim());
  const validProjects = projects.filter((p) => p.name?.trim());
  const validSkills = skills.filter((s) => s.name?.trim());
  const validCerts = certifications.filter((c) => c.name?.trim());
  const validAchievements = achievements.filter((a) => a.title?.trim());
  const validLanguages = languages.filter((l) => l.name?.trim());

  const skillCategories = validSkills.reduce<Record<string, string[]>>((acc, s) => {
    const cat = s.category?.trim() || 'Skills';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s.name.trim());
    return acc;
  }, {});

  const contactItems = [
    location?.trim(),
    phone?.trim(),
    email?.trim(),
    linkedin ? formatUrlForDisplay(linkedin) : null,
    github ? formatUrlForDisplay(github) : null,
    website ? formatUrlForDisplay(website) : null,
  ].filter(Boolean);

  return (
    <div
      className="resume-document bg-white text-gray-900 mx-auto text-left font-serif leading-relaxed"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '18mm 20mm',
        boxSizing: 'border-box',
        fontSize: '10.5pt',
      }}
    >
      <header className="text-center border-b border-gray-900 pb-3 mb-4 page-break-avoid">
        <h1 className="text-2xl font-bold tracking-wider uppercase text-gray-900">
          {fullName || 'Your Name'}
        </h1>
        {contactItems.length > 0 && (
          <p className="text-[9pt] text-gray-700 mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
            {contactItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-gray-400 font-sans">•</span>}
                <span className="break-all">{item}</span>
              </React.Fragment>
            ))}
          </p>
        )}
      </header>

      {summary && summary.trim() && (
        <section className="mb-4 page-break-avoid">
          <h2 className="text-[11pt] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-400 pb-0.5 mb-1.5">
            Professional Summary
          </h2>
          <p className="text-[10pt] text-gray-800 text-justify leading-relaxed break-words">
            {summary.trim()}
          </p>
        </section>
      )}

      {validExperience.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11pt] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-400 pb-0.5 mb-2.5">
            Professional Experience
          </h2>
          <div className="space-y-3">
            {validExperience.map((exp, idx) => {
              const bullets = parseBulletPoints(exp.description);
              const dateStr = formatDateRange(exp.startDate, exp.endDate, exp.current);

              return (
                <article key={idx} className="page-break-avoid">
                  <div className="flex justify-between items-baseline text-[10.5pt]">
                    <div className="min-w-0 flex-1 break-words">
                      <span className="font-bold text-gray-900">{exp.position}</span>
                      {exp.company && (
                        <span className="font-semibold text-gray-800"> — {exp.company}</span>
                      )}
                    </div>
                    {dateStr && (
                      <span className="text-[9.5pt] text-gray-600 font-normal shrink-0 ml-2">
                        {dateStr}
                      </span>
                    )}
                  </div>
                  {exp.location && (
                    <p className="text-[9pt] text-gray-500 italic mb-1">{exp.location}</p>
                  )}
                  {bullets.length > 0 ? (
                    <ul className="list-disc list-outside ml-4 text-[9.5pt] text-gray-800 space-y-0.5 mt-1">
                      {bullets.map((b, bIdx) => (
                        <li key={bIdx} className="leading-snug">
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : exp.description ? (
                    <p className="text-[9.5pt] text-gray-800 mt-1 whitespace-pre-line leading-snug">
                      {exp.description}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {validEducation.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11pt] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-400 pb-0.5 mb-2">
            Education
          </h2>
          <div className="space-y-2.5">
            {validEducation.map((edu, idx) => {
              const dateStr = formatDateRange(edu.startDate, edu.endDate);
              return (
                <div key={idx} className="page-break-avoid text-[10pt]">
                  <div className="flex justify-between items-baseline">
                    <div className="min-w-0 flex-1 break-words">
                      <span className="font-bold text-gray-900">{edu.institution}</span>
                      {edu.degree && (
                        <span className="text-gray-800">
                          , {edu.degree}
                          {edu.field ? ` in ${edu.field}` : ''}
                        </span>
                      )}
                    </div>
                    {dateStr && (
                      <span className="text-[9.5pt] text-gray-600 shrink-0 ml-2">{dateStr}</span>
                    )}
                  </div>
                  {edu.gpa && (
                    <p className="text-[9pt] text-gray-600 mt-0.5">GPA: {edu.gpa}</p>
                  )}
                  {edu.description && (
                    <p className="text-[9pt] text-gray-700 mt-0.5 leading-snug break-words">
                      {edu.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {validProjects.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11pt] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-400 pb-0.5 mb-2">
            Key Projects
          </h2>
          <div className="space-y-2.5">
            {validProjects.map((proj, idx) => {
              const bullets = parseBulletPoints(proj.description);
              const dateStr = formatDateRange(proj.startDate, proj.endDate);

              return (
                <article key={idx} className="page-break-avoid text-[10pt]">
                  <div className="flex justify-between items-baseline gap-2">
                    <div className="min-w-0 flex-1 break-words">
                      <span className="font-bold text-gray-900">{proj.name}</span>
                      {proj.technologies && (
                        <span className="text-[9.5pt] text-gray-700 italic ml-1 break-words">
                          | {proj.technologies}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-2 max-w-[45%] break-all">
                      {dateStr && (
                        <span className="text-[9pt] text-gray-500 mr-2">{dateStr}</span>
                      )}
                      {proj.link && (
                        <span className="text-[9pt] text-gray-600 underline">
                          {formatUrlForDisplay(proj.link)}
                        </span>
                      )}
                    </div>
                  </div>
                  {bullets.length > 0 ? (
                    <ul className="list-disc list-outside ml-4 text-[9.5pt] text-gray-800 space-y-0.5 mt-1">
                      {bullets.map((b, bIdx) => (
                        <li key={bIdx} className="leading-snug">
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : proj.description ? (
                    <p className="text-[9.5pt] text-gray-800 mt-0.5 leading-snug">
                      {proj.description}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {validSkills.length > 0 && (
        <section className="mb-4 page-break-avoid">
          <h2 className="text-[11pt] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-400 pb-0.5 mb-1.5">
            Technical Skills
          </h2>
          <div className="space-y-1 text-[9.5pt] text-gray-800 leading-snug">
            {Object.entries(skillCategories).map(([category, names]) => (
              <p key={category}>
                <strong className="text-gray-900">{category}:</strong> {names.join(', ')}
              </p>
            ))}
          </div>
        </section>
      )}

      {(validCerts.length > 0 || validAchievements.length > 0) && (
        <section className="mb-3 page-break-avoid">
          <h2 className="text-[11pt] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-400 pb-0.5 mb-1.5">
            Honors, Awards & Certifications
          </h2>
          <ul className="list-disc list-outside ml-4 text-[9.5pt] text-gray-800 space-y-0.5">
            {validCerts.map((c, idx) => (
              <li key={`c-${idx}`}>
                <span className="font-semibold">{c.name}</span>
                {c.issuer ? ` — ${c.issuer}` : ''} {c.date ? `(${c.date})` : ''}
              </li>
            ))}
            {validAchievements.map((a, idx) => (
              <li key={`a-${idx}`}>
                <span className="font-semibold">{a.title}</span>
                {a.date ? ` (${a.date})` : ''}
                {a.description ? `: ${a.description}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {validLanguages.length > 0 && (
        <section className="page-break-avoid">
          <h2 className="text-[11pt] font-bold uppercase tracking-wider text-gray-900 border-b border-gray-400 pb-0.5 mb-1.5">
            Languages
          </h2>
          <p className="text-[9.5pt] text-gray-800">
            {validLanguages.map((l) => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(' • ')}
          </p>
        </section>
      )}
    </div>
  );
};

