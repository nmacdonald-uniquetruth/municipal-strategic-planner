import React from 'react';
import MathVerifier from '../components/machias/MathVerifier';
import SectionHeader from '../components/machias/SectionHeader';
import { Calculator } from 'lucide-react';

export default function MathVerify() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Math Verification Engine"
        subtitle="Every calculation cross-checked against source documents — Restructuring Plan v7.1.2 and Model v3.1 XLSX. Click any category to drill into the formula."
        icon={Calculator}
      />
      <MathVerifier />
    </div>
  );
}