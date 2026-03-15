import React from 'react';
import ModelSettingsEditor from '../components/machias/ModelSettingsEditor';
import ComplianceViolationBanner from '@/components/compliance/ComplianceViolationBanner';
import { useComplianceValidation } from '@/components/compliance/useComplianceValidation';
import PositionEditor from '../components/machias/PositionEditor';
import PoliceAdminConfig from '../components/machias/PoliceAdminConfig';
import SectionHeader from '../components/machias/SectionHeader';
import { Settings, Users, Shield } from 'lucide-react';

export default function ModelSettings() {
  const { violations } = useComplianceValidation();
  return (
    <div className="space-y-10">
      <ComplianceViolationBanner violations={violations} />
      <SectionHeader
        title="Model Settings"
        subtitle="All figures are editable — changes ripple through every chart, table, and milestone date"
        icon={Settings}
      />
      <ModelSettingsEditor />

      <SectionHeader
        title="Position Configuration"
        subtitle="Add, remove, or edit positions. Change salaries, benefits, hire timing, and fund source."
        icon={Users}
      />
      <PositionEditor />

      <SectionHeader
        title="Police Department Configuration"
        subtitle="Configure administrative support roles and evaluate operational impacts"
        icon={Shield}
      />
      <PoliceAdminConfig />
    </div>
  );
}