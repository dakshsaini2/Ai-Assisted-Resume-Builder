import React from 'react';
import type { Resume } from '../../types';
import { formatDateRange, parseBulletPoints, formatUrlForDisplay } from '../../utils/formatters';

interface ModernTemplateProps {
  resume: Partial<Resume>;
}

export const ModernTemplate: React.FC<ModernTemplateProps> = ({ resume }) => {
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

  // Filter out empty items
  const validEducation = education.filter((e) => e.institution?.trim() || e.degree?.trim());
  const validExperience = experiences.filter((e) => e.company?.trim() || e.position?.trim());
  const validProjects = projects.filter((p) => p.name?.trim());
  const validSkills = skills.filter((s) => s.name?.trim());
  const validCerts = certifications.filter((c) => c.name?.trim());
  const validAchievements = achievements.filter((a) => a.title?.trim());
  const validLanguages = languages.filter((l) => l.name?.trim());

  // Group skills by category
  const skillCategories = validSkills.reduce<Record<string, string[]>>((acc, s) => {
    const cat = s.category?.trim() || 'Technical Skills';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s.name.trim());
    return acc;
  }, {});

  const contactItems = [
    email ? { label: email.trim(), link: `mailto:${email.trim()}` } : null,
    phone ? { label: phone.trim(), link: `tel:${phone.trim()}` } : null,
    location ? { label: location.trim(), link: null } : null,
    linkedin ? { label: formatUrlForDisplay(linkedin), link: linkedin } : null,
    github ? { label: formatUrlForDisplay(github), link: github } : null,
    website ? { label: formatUrlForDisplay(website), link: website } : null,
  ].filter(Boolean);

  return (
    <div
      className="resume-document bg-white text-gray-800 mx-auto text-left font-sans leading-normal"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '16mm 18mm',
        boxSizing: 'border-box',
        fontSize: '10pt',
      }}
    >
      {/* Header with Stylish Left Accent */}
      <header className="border-l-4 border-primary pl-4 py-1 mb-5 page-break-avoid">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
          {fullName || 'Your Full Name'}
        </h1>
        {contactItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9pt] text-gray-600 mt-1.5 font-medium">
            {contactItems.map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5">
                {idx > 0 && <span className="text-gray-300">•</span>}
                {item!.link ? (
                  <span className="text-gray-700 hover:text-primary transition-colors">
                    {item!.label}
                  </span>
                ) : (
                  <span>{item!.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Professional Summary */}
      {summary && summary.trim() && (
        <section className="mb-4 page-break-avoid">
          <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-primary border-b border-orange-100 pb-1 mb-1.5 flex items-center gap-2">
            <span>Professional Summary</span>
          </h2>
          <p className="text-[9.5pt] text-gray-700 leading-relaxed text-justify">
            {summary.trim()}
          </p>
        </section>
      )}

      {/* Technical Skills - Positioned prominently for tech roles */}
      {validSkills.length > 0 && (
        <section className="mb-4 page-break-avoid">
          <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-primary border-b border-orange-100 pb-1 mb-2">
            Technical Skills
          </h2>
          <div className="space-y-1.5 text-[9.5pt]">
            {Object.entries(skillCategories).map(([category, names]) => (
              <div key={category} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-semibold text-gray-900 min-w-[120px] text-[9pt]">
                  {category}:
                </span>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {names.map((skillName, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 rounded bg-orange-50/80 text-gray-800 text-[8.5pt] font-medium border border-orange-200/50"
                    >
                      {skillName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Work Experience */}
      {validExperience.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-primary border-b border-orange-100 pb-1 mb-2.5">
            Work Experience
          </h2>
          <div className="space-y-3.5">
            {validExperience.map((exp, idx) => {
              const bullets = parseBulletPoints(exp.description);
              const dateStr = formatDateRange(exp.startDate, exp.endDate, exp.current);

              return (
                <article key={idx} className="page-break-avoid">
                  <div className="flex justify-between items-baseline">
                    <div className="text-[10pt]">
                      <span className="font-bold text-gray-900">{exp.position}</span>
                      {exp.company && (
                        <span className="text-gray-600 font-medium"> @ {exp.company}</span>
                      )}
                    </div>
                    {dateStr && (
                      <span className="text-[9pt] font-medium text-gray-500 shrink-0 ml-2">
                        {dateStr}
                      </span>
                    )}
                  </div>
                  {exp.location && (
                    <p className="text-[8.5pt] text-gray-400 italic mb-1">{exp.location}</p>
                  )}
                  {bullets.length > 0 ? (
                    <ul className="list-disc list-outside ml-4 text-[9.5pt] text-gray-700 space-y-1 mt-1">
                      {bullets.map((b, bIdx) => (
                        <li key={bIdx} className="leading-snug">
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : exp.description ? (
                    <p className="text-[9.5pt] text-gray-700 mt-1 whitespace-pre-line leading-snug">
                      {exp.description}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Key Projects */}
      {validProjects.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-primary border-b border-orange-100 pb-1 mb-2.5">
            Projects
          </h2>
          <div className="space-y-3">
            {validProjects.map((proj, idx) => {
              const bullets = parseBulletPoints(proj.description);
              const dateStr = formatDateRange(proj.startDate, proj.endDate);

              return (
                <article key={idx} className="page-break-avoid">
                  <div className="flex justify-between items-baseline text-[10pt]">
                    <div>
                      <span className="font-bold text-gray-900">{proj.name}</span>
                      {proj.technologies && (
                        <span className="text-[8.5pt] text-gray-500 font-normal ml-2 bg-gray-100 px-1.5 py-0.5 rounded">
                          {proj.technologies}
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 text-right ml-2 text-[9pt]">
                      {dateStr && <span className="text-gray-500 mr-2">{dateStr}</span>}
                      {proj.link && (
                        <span className="text-primary font-medium">
                          {formatUrlForDisplay(proj.link)}
                        </span>
                      )}
                    </div>
                  </div>
                  {bullets.length > 0 ? (
                    <ul className="list-disc list-outside ml-4 text-[9.5pt] text-gray-700 space-y-1 mt-1">
                      {bullets.map((b, bIdx) => (
                        <li key={bIdx} className="leading-snug">
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : proj.description ? (
                    <p className="text-[9.5pt] text-gray-700 mt-1 whitespace-pre-line leading-snug">
                      {proj.description}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Education */}
      {validEducation.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-primary border-b border-orange-100 pb-1 mb-2">
            Education
          </h2>
          <div className="space-y-2">
            {validEducation.map((edu, idx) => {
              const dateStr = formatDateRange(edu.startDate, edu.endDate);
              return (
                <div key={idx} className="page-break-avoid text-[9.5pt]">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-gray-900">{edu.degree}</span>
                      {edu.field && <span> in {edu.field}</span>}
                      {edu.institution && (
                        <span className="text-gray-600 font-medium"> — {edu.institution}</span>
                      )}
                      {edu.gpa && (
                        <span className="text-[8.5pt] text-gray-500 ml-2 font-normal">
                          (GPA: {edu.gpa})
                        </span>
                      )}
                    </div>
                    {dateStr && (
                      <span className="text-[9pt] text-gray-500 shrink-0 ml-2">{dateStr}</span>
                    )}
                  </div>
                  {edu.description && (
                    <p className="text-[9pt] text-gray-600 mt-0.5 leading-snug">
                      {edu.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Certifications, Achievements & Languages */}
      {(validCerts.length > 0 || validAchievements.length > 0 || validLanguages.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 page-break-avoid">
          {(validCerts.length > 0 || validAchievements.length > 0) && (
            <div>
              <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-primary border-b border-orange-100 pb-1 mb-2">
                Honors & Certifications
              </h2>
              <ul className="text-[9pt] text-gray-700 space-y-1">
                {validCerts.map((c, idx) => (
                  <li key={`c-${idx}`}>
                    <strong className="text-gray-900">{c.name}</strong>
                    {c.issuer ? ` — ${c.issuer}` : ''}
                  </li>
                ))}
                {validAchievements.map((a, idx) => (
                  <li key={`a-${idx}`}>
                    <strong className="text-gray-900">{a.title}</strong>
                    {a.description ? `: ${a.description}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validLanguages.length > 0 && (
            <div>
              <h2 className="text-[10.5pt] font-bold uppercase tracking-wider text-primary border-b border-orange-100 pb-1 mb-2">
                Languages
              </h2>
              <div className="flex flex-wrap gap-2 text-[9pt] text-gray-700">
                {validLanguages.map((l, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-800"
                  >
                    <strong>{l.name}</strong> {l.proficiency ? `(${l.proficiency})` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
