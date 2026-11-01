import React from 'react';
import type { Resume } from '../../types';

interface ResumePreviewProps {
  resume: Partial<Resume>;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ resume }) => {
  const {
    fullName = 'Alex Morgan',
    email = 'alex.morgan@example.com',
    phone = '+1 (555) 019-2834',
    location = 'San Francisco, CA',
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
    templateId = 'modern',
  } = resume;

  // 1. CLASSIC ATS TEMPLATE (Single column, high contrast, clean rules)
  if (templateId === 'classic') {
    return (
      <div className="bg-white text-gray-900 p-8 sm:p-12 shadow-md max-w-[210mm] min-h-[297mm] mx-auto text-left text-[13px] leading-normal font-serif">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-900 pb-4 mb-4">
          <h1 className="text-2xl font-bold tracking-wider uppercase text-gray-900">
            {fullName || 'Your Name'}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-700 mt-1">
            {location && <span>{location}</span>}
            {phone && <span>• {phone}</span>}
            {email && <span>• {email}</span>}
            {linkedin && <span>• {linkedin}</span>}
            {github && <span>• {github}</span>}
            {website && <span>• {website}</span>}
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-0.5 mb-1.5 text-gray-900">
              Professional Summary
            </h2>
            <p className="text-xs text-gray-800 text-justify leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-0.5 mb-2 text-gray-900">
              Work Experience
            </h2>
            <div className="space-y-3">
              {experiences.map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline text-xs font-bold">
                    <span>
                      {exp.position} — <span className="font-semibold">{exp.company}</span>
                    </span>
                    <span className="text-gray-600 font-normal">
                      {exp.startDate} {exp.startDate && (exp.endDate || exp.current) ? '–' : ''}{' '}
                      {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  {exp.location && (
                    <p className="text-[11px] text-gray-500 italic mb-1">{exp.location}</p>
                  )}
                  {exp.description && (
                    <div className="text-xs text-gray-700 whitespace-pre-line leading-relaxed pl-2 mt-0.5">
                      {exp.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-0.5 mb-2 text-gray-900">
              Education
            </h2>
            <div className="space-y-2">
              {education.map((edu, i) => (
                <div key={i} className="text-xs">
                  <div className="flex justify-between font-bold">
                    <span>
                      {edu.degree} {edu.field ? `in ${edu.field}` : ''} — {edu.institution}
                    </span>
                    <span className="text-gray-600 font-normal">
                      {edu.startDate} {edu.startDate && edu.endDate ? '–' : ''} {edu.endDate}
                    </span>
                  </div>
                  {edu.gpa && <p className="text-[11px] text-gray-600">GPA: {edu.gpa}</p>}
                  {edu.description && (
                    <p className="text-[11px] text-gray-700 mt-0.5">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-0.5 mb-2 text-gray-900">
              Key Projects
            </h2>
            <div className="space-y-2.5">
              {projects.map((proj, i) => (
                <div key={i} className="text-xs">
                  <div className="flex justify-between font-bold">
                    <span>
                      {proj.name}{' '}
                      {proj.technologies && (
                        <span className="font-normal text-gray-600">({proj.technologies})</span>
                      )}
                    </span>
                    {proj.link && (
                      <span className="text-[11px] text-gray-500 font-normal">{proj.link}</span>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-gray-700 whitespace-pre-line mt-0.5">{proj.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-0.5 mb-1.5 text-gray-900">
              Technical Skills
            </h2>
            <div className="text-xs text-gray-800 leading-relaxed">
              {skills.map((s) => s.name).join(' • ')}
            </div>
          </div>
        )}

        {/* Certifications & Achievements */}
        {(certifications.length > 0 || achievements.length > 0) && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-gray-400 pb-0.5 mb-1.5 text-gray-900">
              Certifications & Honors
            </h2>
            <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
              {certifications.map((c, i) => (
                <li key={`cert-${i}`}>
                  <span className="font-semibold">{c.name}</span>
                  {c.issuer ? ` — ${c.issuer}` : ''} {c.date ? `(${c.date})` : ''}
                </li>
              ))}
              {achievements.map((a, i) => (
                <li key={`ach-${i}`}>
                  <span className="font-semibold">{a.title}</span>
                  {a.description ? `: ${a.description}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // 2. CREATIVE TEMPLATE (Dual column, elegant sidebar)
  if (templateId === 'creative') {
    return (
      <div className="bg-white text-gray-800 shadow-md max-w-[210mm] min-h-[297mm] mx-auto text-left flex overflow-hidden font-sans">
        {/* Left Dark Sidebar */}
        <div className="w-[34%] bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between text-xs">
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">{fullName}</h1>
              <p className="text-xs text-orange-400 font-semibold tracking-wide uppercase mt-1">
                Professional Resume
              </p>
            </div>

            {/* Contact */}
            <div className="space-y-2 text-[11px] text-gray-300 border-t border-gray-800 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Contact</h3>
              {email && <p className="break-all">{email}</p>}
              {phone && <p>{phone}</p>}
              {location && <p>{location}</p>}
              {linkedin && <p className="break-all text-gray-400">{linkedin}</p>}
              {github && <p className="break-all text-gray-400">{github}</p>}
              {website && <p className="break-all text-gray-400">{website}</p>}
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="space-y-2 border-t border-gray-800 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Skills & Tools
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-gray-800 text-gray-200 text-[10px]"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div className="space-y-3 border-t border-gray-800 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Education
                </h3>
                {education.map((edu, i) => (
                  <div key={i} className="text-[11px]">
                    <p className="font-semibold text-white">{edu.degree}</p>
                    <p className="text-gray-400">{edu.institution}</p>
                    <p className="text-gray-500 text-[10px]">
                      {edu.startDate} – {edu.endDate}
                    </p>
                    {edu.gpa && <p className="text-orange-300 text-[10px]">GPA: {edu.gpa}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <div className="space-y-2 border-t border-gray-800 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Languages
                </h3>
                {languages.map((l, i) => (
                  <div key={i} className="flex justify-between text-[11px] text-gray-300">
                    <span>{l.name}</span>
                    <span className="text-gray-500">{l.proficiency}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Main Column */}
        <div className="w-[66%] p-6 sm:p-8 space-y-6 text-xs">
          {summary && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b-2 border-orange-500 pb-1 mb-2">
                Executive Profile
              </h2>
              <p className="text-gray-700 leading-relaxed text-justify">{summary}</p>
            </div>
          )}

          {experiences.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b-2 border-orange-500 pb-1 mb-3">
                Experience
              </h2>
              <div className="space-y-4">
                {experiences.map((exp, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>{exp.position}</span>
                      <span className="text-gray-500 font-normal">
                        {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    <p className="text-primary font-semibold text-[11px]">{exp.company}</p>
                    {exp.description && (
                      <div className="text-gray-600 whitespace-pre-line leading-relaxed pl-1">
                        {exp.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b-2 border-orange-500 pb-1 mb-3">
                Featured Projects
              </h2>
              <div className="space-y-3">
                {projects.map((proj, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>{proj.name}</span>
                      {proj.link && <span className="text-gray-400 font-normal">{proj.link}</span>}
                    </div>
                    {proj.technologies && (
                      <p className="text-[10px] text-gray-500">{proj.technologies}</p>
                    )}
                    {proj.description && (
                      <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                        {proj.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(certifications.length > 0 || achievements.length > 0) && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b-2 border-orange-500 pb-1 mb-2">
                Honors & Certifications
              </h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {certifications.map((c, i) => (
                  <li key={`c-${i}`}>
                    <span className="font-semibold">{c.name}</span> ({c.issuer})
                  </li>
                ))}
                {achievements.map((a, i) => (
                  <li key={`a-${i}`}>
                    <span className="font-semibold">{a.title}</span>
                    {a.description ? ` — ${a.description}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. MODERN TECH TEMPLATE (Default: Contemporary accents, crisp section headers)
  return (
    <div className="bg-white text-charcoal p-8 sm:p-12 shadow-md max-w-[210mm] min-h-[297mm] mx-auto text-left font-sans text-[13px] leading-normal border border-gray-100">
      {/* Header with Orange Accent Bar */}
      <div className="border-l-4 border-primary pl-4 pb-1 mb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal tracking-tight">
          {fullName || 'Your Full Name'}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-charcoal-light mt-1.5">
          {email && <span>{email}</span>}
          {phone && <span>• {phone}</span>}
          {location && <span>• {location}</span>}
          {linkedin && <span>• {linkedin}</span>}
          {github && <span>• {github}</span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-orange-100 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-xs text-charcoal-light leading-relaxed text-justify">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-orange-100 pb-1 mb-3">
            Experience
          </h2>
          <div className="space-y-3.5">
            {experiences.map((exp, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-charcoal text-xs">
                    {exp.position} <span className="font-normal text-gray-500">at</span> {exp.company}
                  </h3>
                  <span className="text-[11px] font-medium text-gray-500">
                    {exp.startDate} {exp.startDate && (exp.endDate || exp.current) ? '–' : ''}{' '}
                    {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                {exp.location && (
                  <p className="text-[11px] text-gray-400 italic">{exp.location}</p>
                )}
                {exp.description && (
                  <div className="text-xs text-charcoal-light whitespace-pre-line leading-relaxed pl-1.5 mt-1">
                    {exp.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-orange-100 pb-1 mb-3">
            Projects
          </h2>
          <div className="space-y-3">
            {projects.map((proj, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-charcoal text-xs">
                    {proj.name}
                    {proj.technologies && (
                      <span className="font-normal text-gray-500 text-[11px] ml-2">
                        [{proj.technologies}]
                      </span>
                    )}
                  </h3>
                  {proj.link && (
                    <span className="text-[11px] text-primary">{proj.link}</span>
                  )}
                </div>
                {proj.description && (
                  <p className="text-xs text-charcoal-light whitespace-pre-line leading-relaxed pl-1.5">
                    {proj.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-orange-100 pb-1 mb-2.5">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu, i) => (
              <div key={i} className="flex justify-between items-baseline text-xs">
                <div>
                  <span className="font-bold text-charcoal">
                    {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                  </span>
                  <span className="text-gray-500"> — {edu.institution}</span>
                  {edu.gpa && <span className="text-gray-400 ml-2">GPA: {edu.gpa}</span>}
                </div>
                <span className="text-[11px] text-gray-500">
                  {edu.startDate} {edu.startDate && edu.endDate ? '–' : ''} {edu.endDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-orange-100 pb-1 mb-2">
            Technical Skills
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-md bg-orange-50 text-charcoal text-[11px] font-medium border border-orange-200/60"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications & Languages */}
      {(certifications.length > 0 || languages.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-orange-100 pb-1 mb-2">
                Certifications
              </h2>
              <ul className="space-y-1 text-xs text-charcoal-light">
                {certifications.map((c, i) => (
                  <li key={i}>
                    <span className="font-semibold text-charcoal">{c.name}</span>
                    {c.issuer && <span className="text-gray-400"> ({c.issuer})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {languages.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-orange-100 pb-1 mb-2">
                Languages
              </h2>
              <div className="flex flex-wrap gap-2 text-xs text-charcoal-light">
                {languages.map((l, i) => (
                  <span key={i} className="text-charcoal font-medium">
                    {l.name} {l.proficiency && <span className="text-gray-400">({l.proficiency})</span>}
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
