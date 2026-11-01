import React from 'react';
import { Plus, Trash2, FolderGit2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import type { Project } from '../../types';

interface ProjectsFormProps {
  items: Project[];
  onChange: (items: Project[]) => void;
}

export const ProjectsForm: React.FC<ProjectsFormProps> = ({ items, onChange }) => {
  const handleAdd = () => {
    onChange([
      ...items,
      {
        name: '',
        description: '',
        technologies: '',
        link: '',
        startDate: '',
        endDate: '',
        sortOrder: items.length,
      },
    ]);
  };

  const handleUpdate = (index: number, fields: Partial<Project>) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...fields };
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-charcoal">Projects</h3>
          <p className="text-xs text-charcoal-light mt-0.5">
            Highlight personal, academic, or open-source projects demonstrating your technical skills.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Project
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <FolderGit2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-charcoal">No projects added yet</p>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">
            Showcase your best engineering and development work.
          </p>
          <Button size="sm" variant="primary" onClick={handleAdd}>
            Add Project
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-5 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
                  Project #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                  aria-label="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Project Title"
                  placeholder="e.g. AI Resume Builder"
                  value={item.name}
                  onChange={(e) => handleUpdate(index, { name: e.target.value })}
                  required
                />
                <Input
                  label="Technologies Used"
                  placeholder="e.g. React, Node.js, PostgreSQL, Docker"
                  value={item.technologies || ''}
                  onChange={(e) => handleUpdate(index, { technologies: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Project Link / GitHub URL"
                  placeholder="e.g. github.com/user/project"
                  value={item.link || ''}
                  onChange={(e) => handleUpdate(index, { link: e.target.value })}
                />
                <Input
                  label="Start Date"
                  placeholder="e.g. Jan 2024"
                  value={item.startDate || ''}
                  onChange={(e) => handleUpdate(index, { startDate: e.target.value })}
                />
                <Input
                  label="End Date"
                  placeholder="e.g. Present or Apr 2024"
                  value={item.endDate || ''}
                  onChange={(e) => handleUpdate(index, { endDate: e.target.value })}
                />
              </div>

              <Textarea
                label="Description & Key Features"
                rows={3}
                placeholder="• Built a full-stack platform with JWT authentication and responsive UI.&#10;• Orchestrated automated Docker container workflows."
                value={item.description || ''}
                onChange={(e) => handleUpdate(index, { description: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

