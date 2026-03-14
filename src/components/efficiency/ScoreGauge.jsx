import React from 'react';

export default function ScoreGauge({ score, label, size = 'md' }) {
  const radius = size === 'lg' ? 52 : 36;
  const stroke = size === 'lg' ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const dim = (radius + stroke) * 2;
  const center = radius + stroke;

  const color = score >= 80 ? '#2A7F7F' : score >= 60 ? '#F6C85F' : '#e05c3a';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx={center} cy={center} r={radius} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute" style={{ marginTop: size === 'lg' ? '-76px' : '-54px' }}>
        <p className="text-center font-bold" style={{ fontSize: size === 'lg' ? 22 : 15, color }}>{score}</p>
      </div>
      {label && <p className="text-[10px] text-slate-500 text-center leading-tight max-w-[80px]">{label}</p>}
    </div>
  );
}