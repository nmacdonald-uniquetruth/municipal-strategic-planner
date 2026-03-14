import React from 'react';
import { Outlet } from 'react-router-dom';
import { ModelProvider } from './components/machias/ModelContext';

export default function Layout({ children }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&family=Open+Sans:ital,wght@0,300;0,400;0,700;1,400&display=swap');

        body {
          font-family: 'Open Sans', Arial, Helvetica, sans-serif;
          background-color: #F3EAD6;
          color: #2F2F30;
        }

        h1, h2, h3, h4, h5, h6,
        .font-bold, .font-semibold, .font-medium {
          font-family: 'Raleway', Arial, Helvetica, sans-serif;
        }

        /* Card overrides — use white or cream tones */
        .rounded-xl.border, .rounded-2xl.border {
          background-color: #ffffff;
        }

        /* Subtle page background */
        .bg-slate-50  { background-color: #F3EAD6 !important; }
        .bg-slate-100 { background-color: #EDE4D0 !important; }

        /* Primary button → Machias Blue */
        .bg-slate-900 { background-color: #344A60 !important; }
        .hover\\:bg-slate-700:hover { background-color: #2a3c4f !important; }
        .hover\\:bg-slate-800:hover { background-color: #2a3c4f !important; }
        .text-slate-900 { color: #2F2F30 !important; }

        /* Borders */
        .border-slate-200 { border-color: #ddd0bc !important; }
        .border-slate-300 { border-color: #c9bba6 !important; }

        /* Gradient hero banner on Dashboard → Machias Blue */
        .bg-gradient-to-r.from-slate-900 {
          background: linear-gradient(to right, #344A60, #2a3c4f) !important;
        }

        /* Table header rows */
        .bg-slate-900.text-white {
          background-color: #344A60 !important;
        }

        /* Muted text */
        .text-slate-500 { color: #6b6153 !important; }
        .text-slate-400 { color: #8a7e72 !important; }
        .text-slate-600 { color: #4a4030 !important; }

        /* Active/selected nav highlight accent = Salt Marsh Grass */
        /* (Applied inline in AppLayout) */

        /* Emerald accents → Harbor Deep teal */
        .text-emerald-700 { color: #2A7F7F !important; }
        .text-emerald-800 { color: #226969 !important; }
        .bg-emerald-50    { background-color: #e8f4f4 !important; }
        .border-emerald-200 { border-color: #a8d4d4 !important; }

        /* Amber accents → Autumn Foliage rust */
        .text-amber-700   { color: #9C5334 !important; }
        .text-amber-800   { color: #7f4229 !important; }
        .bg-amber-50      { background-color: #fdf3ec !important; }
        .border-amber-200 { border-color: #e8c4a8 !important; }

        /* Blue accents → Misty Blue / Harbor Deep */
        .text-blue-700  { color: #2A7F7F !important; }
        .text-blue-800  { color: #226969 !important; }
        .bg-blue-50     { background-color: #e8f4f4 !important; }
        .border-blue-200 { border-color: #b3c6c8 !important; }

        /* Stat cards */
        .bg-white { background-color: #ffffff; }
      `}</style>
      {children || <Outlet />}
    </>
  );
}