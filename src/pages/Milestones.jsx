import React from 'react';
import MilestoneBoard from '../components/machias/MilestoneBoard';
import DecisionTracker from '../components/machias/DecisionTracker';
import SectionHeader from '../components/machias/SectionHeader';
import { ClipboardList, Gavel } from 'lucide-react';

export default function Milestones() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Implementation Milestones"
        subtitle="Track progress across all initiatives"
        icon={ClipboardList}
      />
      <MilestoneBoard />

      <SectionHeader
        title="Decision Log"
        subtitle="Track decisions requiring Select Board, Town Manager, or committee action"
        icon={Gavel}
      />
      <DecisionTracker />
    </div>
  );
}