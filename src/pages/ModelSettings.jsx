import React from 'react';
import ModelSettingsEditor from '../components/machias/ModelSettingsEditor';
import PositionEditor from '../components/machias/PositionEditor';
import SectionHeader from '../components/machias/SectionHeader';
import { Settings, Users } from 'lucide-react';

export default function ModelSettings() {
  return (
    <div className="space-y-10">
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
    </div>
  );
}