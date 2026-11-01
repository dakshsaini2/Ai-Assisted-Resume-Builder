import React from 'react';
import { Input } from '../common/Input';
import type { Resume } from '../../types';

interface PersonalInfoFormProps {
  data: Partial<Resume>;
  onChange: (fields: Partial<Resume>) => void;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-charcoal">Personal Information</h3>
        <p className="text-xs text-charcoal-light mt-0.5">
          Recruiters and hiring managers will use this information to contact you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          placeholder="e.g. Jane Doe"
          value={data.fullName || ''}
          onChange={(e) => onChange({ fullName: e.target.value })}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. jane@example.com"
          value={data.email || ''}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Phone Number"
          placeholder="e.g. +1 (555) 123-4567"
          value={data.phone || ''}
          onChange={(e) => onChange({ phone: e.target.value })}
        />
        <Input
          label="Location"
          placeholder="e.g. San Francisco, CA"
          value={data.location || ''}
          onChange={(e) => onChange({ location: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="LinkedIn Profile"
          placeholder="linkedin.com/in/username"
          value={data.linkedin || ''}
          onChange={(e) => onChange({ linkedin: e.target.value })}
        />
        <Input
          label="GitHub Profile"
          placeholder="github.com/username"
          value={data.github || ''}
          onChange={(e) => onChange({ github: e.target.value })}
        />
        <Input
          label="Portfolio / Website"
          placeholder="https://yourportfolio.dev"
          value={data.website || ''}
          onChange={(e) => onChange({ website: e.target.value })}
        />
      </div>
    </div>
  );
};

