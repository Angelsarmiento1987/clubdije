import React from 'react';
import {clubCrests} from './club-crests.js';

export function ComicLogo({className, full = false, label}) {
  const viewBox = full ? '0 0 1536 1024' : '0 230 1536 794';
  return <svg className={className} viewBox={viewBox} role={label ? 'img' : undefined}
    aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
    <image href="./logo-card.png" width="1536" height="1024" />
  </svg>;
}

const illustrations = {
  quince: <>
    <path d="m31 31-4-13 11 6 12-12 11 12 12-6-4 13z" fill="#fff293" stroke="#40216c" strokeWidth="3" strokeLinejoin="round" />
    <text x="48" y="82" fill="#fff" stroke="#492b8a" strokeWidth="3" paintOrder="stroke" textAnchor="middle" fontFamily="DijeItalic, Arial, sans-serif" fontWeight="800" fontSize="60">15</text>
    <path d="M14 33v18m-9-9h18m66 13v16m-8-8h16" stroke="#fff293" strokeWidth="4" strokeLinecap="round" />
  </>,
  musica: <>
    <path d="M35 67V28l48-12v43c0 8-8 14-17 14-8 0-12-4-12-9 0-8 9-13 18-12V35l-26 7v30c0 8-8 14-17 14-8 0-12-4-12-9 0-8 9-13 18-12z" fill="#fff3a2" stroke="#38234e" strokeWidth="3" strokeLinejoin="round" />
    <path d="m17 26 6 4m-1-15 5 7m61 61 6-4" fill="none" stroke="#fff9eb" strokeWidth="3" strokeLinecap="round" />
  </>,
  natacion: <>
    <circle cx="71" cy="40" r="10" fill="#fff9eb" />
    <path d="M15 57 40 37l13 10 9 10m-22-20 6-15 17 4" stroke="#fff9eb" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 63q10-9 21 0t21 0 21 0 21 0M9 78q10-9 21 0t21 0 21 0 21 0" fill="none" stroke="#fff9eb" strokeWidth="4" strokeLinecap="round" />
    <path d="m82 24 4-8m4 17 9-3" stroke="#c9f9ff" strokeWidth="3" strokeLinecap="round" />
  </>,
  colibries: <>
    <path d="M18 24c21 1 32 8 38 24C51 30 53 16 69 8c-3 21-4 35-13 47-17-4-30-16-38-31Z" fill="#e9ffa2" stroke="#155645" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M12 77 41 54c11-8 14-20 26-23 7-2 14 1 17 7l14 1-16 5C70 62 54 72 34 70L12 77Z" fill="#fff9eb" stroke="#155645" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M37 66c15-2 24-9 34-21" stroke="#47a684" strokeWidth="4" fill="none" strokeLinecap="round" />
    <circle cx="74" cy="38" r="2.2" fill="#155645" />
  </>,
};

export function CollectionArt({id}) {
  const crest = clubCrests[id];
  if (crest) return <img className="collection-art collection-crest" src={crest.src} alt="" />;
  return <svg className="collection-art" viewBox="0 0 104 96" aria-hidden="true" focusable="false">{illustrations[id]}</svg>;
}
