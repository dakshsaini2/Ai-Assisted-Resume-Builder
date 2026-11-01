import React, { useState } from 'react';
import { Plus, X, Cpu } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import type { Skill } from '../../types';

interface SkillsFormProps {
  items: Skill[];
  onChange: (items: Skill[]) => void;
}

const COMMON_CATEGORIES = [
  'Programming Languages',
  'Frontend Development',
  'Backend & APIs',
  'Databases & Storage',
  'DevOps & Cloud',
  'Tools & Frameworks',
  'Soft Skills',
];

export const SkillsForm: React.FC<SkillsFormProps> = ({ items, onChange }) => {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState(COMMON_CATEGORIES[0]);
  const [newSkillLevel, setNewSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('Advanced');

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    onChange([
      ...items,
      {
        name: newSkillName.trim(),
        category: newSkillCategory,
        level: newSkillLevel,
      },
    ]);
    setNewSkillName('');
  };

  const handleRemoveSkill = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const groupedSkills = items.reduce<Record<string, { skill: Skill; index: number }[]>>(
    (acc, skill, index) => {
      const cat = skill.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({ skill, index });
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-charcoal">Technical & Professional Skills</h3>
        <p className="text-xs text-charcoal-light mt-0.5">
          Organize your competencies into categories for better ATS indexing and readability.
        </p>
      </div>

      <form
        onSubmit={handleAddSkill}
        className="p-4 rounded-xl border border-orange-200/80 bg-orange-50/40 space-y-3"
      >
        <span className="text-xs font-bold text-primary uppercase tracking-wider">
          Add New Skill
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-2">
            <Input
              label="Skill Name"
              placeholder="e.g. TypeScript, Docker, PostgreSQL"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              Category
            </label>
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {COMMON_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              Level
            </label>
            <select
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value as any)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Button
              type="submit"
              size="md"
              className="w-full"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Skill
            </Button>
          </div>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <Cpu className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-charcoal">No skills added yet</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Use the form above to add your technical abilities.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedSkills).map(([category, skillList]) => (
            <div key={category} className="p-4 rounded-xl border border-gray-200 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal mb-3">
                {category} ({skillList.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {skillList.map(({ skill, index }) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-warm-white border border-gray-200 text-xs font-medium text-charcoal hover:border-gray-300 transition-colors"
                  >
                    <span>{skill.name}</span>
                    {skill.level && (
                      <span className="text-[10px] text-gray-400">
                        • {skill.level}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                      aria-label="Remove skill"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
