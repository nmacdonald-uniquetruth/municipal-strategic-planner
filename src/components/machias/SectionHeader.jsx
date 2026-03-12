import React from 'react';

export default function SectionHeader({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
          <Icon className="h-5 w-5 text-white" />
        </div>
      )}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}