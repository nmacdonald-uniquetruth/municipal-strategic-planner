import React from 'react';
import TimelineAI from '../components/machias/TimelineAI';
import SectionHeader from '../components/machias/SectionHeader';
import { MessageSquare } from 'lucide-react';

export default function AIPlanner() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="AI Strategic Planning Assistant"
        subtitle="Ask about timeline trade-offs, financial scenarios, Select Board presentation strategy, or ERP sequencing"
        icon={MessageSquare}
      />
      <TimelineAI />
    </div>
  );
}