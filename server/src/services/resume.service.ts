import prisma from '../config/database';
import { ApiError } from '../utils/apiError';
import { CreateResumeInput, UpdateResumeInput } from '../validators/resume.validator';

const resumeInclude = {
  education: { orderBy: { sortOrder: 'asc' as const } },
  experiences: { orderBy: { sortOrder: 'asc' as const } },
  projects: { orderBy: { sortOrder: 'asc' as const } },
  skills: true,
  certifications: true,
  achievements: { orderBy: { sortOrder: 'asc' as const } },
  languages: true,
};

export const listResumes = async (userId: string) => {
  return prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      templateId: true,
      fullName: true,
      updatedAt: true,
      createdAt: true,
      _count: {
        select: {
          education: true,
          experiences: true,
          projects: true,
          skills: true,
        },
      },
    },
  });
};

export const createResume = async (userId: string, data: CreateResumeInput) => {
  let fullName = data.fullName;
  let email = data.email;

  if (!fullName || !email) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      if (!fullName) fullName = `${user.firstName} ${user.lastName}`.trim();
      if (!email) email = user.email;
    }
  }

  return prisma.resume.create({
    data: {
      userId,
      title: data.title,
      templateId: data.templateId,
      fullName,
      email,
      phone: data.phone,
      location: data.location,
      linkedin: data.linkedin,
      github: data.github,
      website: data.website,
      summary: data.summary,
    },
    include: resumeInclude,
  });
};

export const getResumeById = async (userId: string, resumeId: string) => {
  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
    include: resumeInclude,
  });

  if (!resume) {
    throw ApiError.notFound('Resume not found.');
  }

  return resume;
};

export const updateResume = async (
  userId: string,
  resumeId: string,
  data: UpdateResumeInput
) => {
  const existing = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });

  if (!existing) {
    throw ApiError.notFound('Resume not found.');
  }

  return prisma.$transaction(async (tx) => {
    const {
      education,
      experiences,
      projects,
      skills,
      certifications,
      achievements,
      languages,
      ...basicFields
    } = data;

    await tx.resume.update({
      where: { id: resumeId },
      data: basicFields,
    });

    if (education !== undefined) {
      await tx.education.deleteMany({ where: { resumeId } });
      if (education.length > 0) {
        await tx.education.createMany({
          data: education.map((item, index) => ({
            resumeId,
            institution: item.institution,
            degree: item.degree,
            field: item.field ?? null,
            startDate: item.startDate ?? null,
            endDate: item.endDate ?? null,
            gpa: item.gpa ?? null,
            description: item.description ?? null,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }
    }

    if (experiences !== undefined) {
      await tx.experience.deleteMany({ where: { resumeId } });
      if (experiences.length > 0) {
        await tx.experience.createMany({
          data: experiences.map((item, index) => ({
            resumeId,
            company: item.company,
            position: item.position,
            location: item.location ?? null,
            startDate: item.startDate ?? null,
            endDate: item.endDate ?? null,
            current: item.current ?? false,
            description: item.description ?? null,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }
    }

    if (projects !== undefined) {
      await tx.project.deleteMany({ where: { resumeId } });
      if (projects.length > 0) {
        await tx.project.createMany({
          data: projects.map((item, index) => ({
            resumeId,
            name: item.name,
            description: item.description ?? null,
            technologies: item.technologies ?? null,
            link: item.link ?? null,
            startDate: item.startDate ?? null,
            endDate: item.endDate ?? null,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }
    }

    if (skills !== undefined) {
      await tx.skill.deleteMany({ where: { resumeId } });
      if (skills.length > 0) {
        await tx.skill.createMany({
          data: skills.map((item) => ({
            resumeId,
            category: item.category || 'General',
            name: item.name,
            level: item.level ?? null,
          })),
        });
      }
    }

    if (certifications !== undefined) {
      await tx.certification.deleteMany({ where: { resumeId } });
      if (certifications.length > 0) {
        await tx.certification.createMany({
          data: certifications.map((item) => ({
            resumeId,
            name: item.name,
            issuer: item.issuer ?? null,
            date: item.date ?? null,
            expiryDate: item.expiryDate ?? null,
            credentialId: item.credentialId ?? null,
            url: item.url ?? null,
          })),
        });
      }
    }

    if (achievements !== undefined) {
      await tx.achievement.deleteMany({ where: { resumeId } });
      if (achievements.length > 0) {
        await tx.achievement.createMany({
          data: achievements.map((item, index) => ({
            resumeId,
            title: item.title,
            description: item.description ?? null,
            date: item.date ?? null,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }
    }

    if (languages !== undefined) {
      await tx.language.deleteMany({ where: { resumeId } });
      if (languages.length > 0) {
        await tx.language.createMany({
          data: languages.map((item) => ({
            resumeId,
            name: item.name,
            proficiency: item.proficiency ?? null,
          })),
        });
      }
    }

    return tx.resume.findUnique({
      where: { id: resumeId },
      include: resumeInclude,
    });
  });
};

export const deleteResume = async (userId: string, resumeId: string) => {
  const existing = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
  });

  if (!existing) {
    throw ApiError.notFound('Resume not found.');
  }

  await prisma.resume.delete({
    where: { id: resumeId },
  });
};

