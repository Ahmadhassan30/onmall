"use client";
import React from 'react';

/**
 * Branded Loader (typewriter style) adapted to OnMall color palette.
 * Colors:
 *  - primary gradient: orange-500 -> orange-600
 *  - tool/accent: amber-400
 *  - paper/text neutrals aligned with existing gray backgrounds
 */
export const Loader: React.FC<{ fullscreen?: boolean; label?: string }>= ({ fullscreen = false, label = 'Loading' }) => {
  return (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm'
          : 'flex items-center justify-center'
      }
      aria-label={label}
      role="status"
    >
      <div className="onmall-typewriter">
        <div className="slide"><i /></div>
        <div className="paper" />
        <div className="keyboard" />
      </div>
      <span className="sr-only">{label}</span>
      <style jsx>{`
        .onmall-typewriter {
          --primary: #f97316; /* orange-500 */
          --primary-dark: #ea580c; /* orange-600 */
          --key: #ffffff;
          --paper: #f3f4f6; /* gray-100 */
          --text: #d1d5db; /* gray-300 */
          --tool: #fbbf24; /* amber-400 */
          --duration: 3s;
          position: relative;
          animation: om-bounce var(--duration) linear infinite;
        }
        .onmall-typewriter .slide {
          width: 92px;
          height: 20px;
          border-radius: 3px;
          margin-left: 14px;
          transform: translateX(14px);
          background: linear-gradient(var(--primary), var(--primary-dark));
          animation: om-slide var(--duration) ease infinite;
          position: relative;
        }
        .onmall-typewriter .slide:before,
        .onmall-typewriter .slide:after,
        .onmall-typewriter .slide i:before {
          content: "";
          position: absolute;
          background: var(--tool);
        }
        .onmall-typewriter .slide:before { width:2px; height:8px; top:6px; left:100%; }
        .onmall-typewriter .slide:after { left:94px; top:3px; height:14px; width:6px; border-radius:3px; }
        .onmall-typewriter .slide i { display:block; position:absolute; right:100%; width:6px; height:4px; top:4px; background: var(--tool); }
        .onmall-typewriter .slide i:before { right:100%; top:-2px; width:4px; border-radius:2px; height:14px; }
        .onmall-typewriter .paper { position:absolute; left:24px; top:-26px; width:40px; height:46px; border-radius:5px; background: var(--paper); transform: translateY(46px); animation: om-paper var(--duration) linear infinite; }
        .onmall-typewriter .paper:before { content:""; position:absolute; left:6px; right:6px; top:7px; border-radius:2px; height:4px; transform: scaleY(.8); background: var(--text); box-shadow:0 12px 0 var(--text), 0 24px 0 var(--text), 0 36px 0 var(--text); }
        .onmall-typewriter .keyboard { width:120px; height:56px; margin-top:-10px; z-index:1; position:relative; }
        .onmall-typewriter .keyboard:before { content:""; position:absolute; inset:0; border-radius:7px; background: linear-gradient(135deg,var(--primary),var(--primary-dark)); transform: perspective(10px) rotateX(2deg); transform-origin:50% 100%; }
        .onmall-typewriter .keyboard:after { content:""; position:absolute; left:2px; top:25px; width:11px; height:4px; border-radius:2px; box-shadow:15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key); animation: om-keys var(--duration) linear infinite; }
        @keyframes om-bounce { 85%,92%,100% { transform: translateY(0);} 89% { transform: translateY(-4px);} 95% { transform: translateY(2px);} }
        @keyframes om-slide { 5% {transform:translateX(14px);} 15%,30% {transform:translateX(6px);} 40%,55% {transform:translateX(0);} 65%,70% {transform:translateX(-4px);} 80%,89% {transform:translateX(-12px);} 100% {transform:translateX(14px);} }
        @keyframes om-paper { 5% {transform:translateY(46px);} 20%,30% {transform:translateY(34px);} 40%,55% {transform:translateY(22px);} 65%,70% {transform:translateY(10px);} 80%,85% {transform:translateY(0);} 92%,100% {transform:translateY(46px);} }
        @keyframes om-keys { 5%,12%,21%,30%,39%,48%,57%,66%,75%,84% { box-shadow:15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key);} 9% { box-shadow:15px 2px 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key);} 18% { box-shadow:15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 2px 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key);} 27% { box-shadow:15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 12px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key);} 36% { box-shadow:15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 12px 0 var(--key),60px 12px 0 var(--key),68px 12px 0 var(--key),83px 10px 0 var(--key);} 45% { box-shadow:15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 2px 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key);} 54% { box-shadow:15px 0 0 var(--key),30px 2px 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key);} 63% { box-shadow:15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 12px 0 var(--key);} 72% { box-shadow:15px 0 0 var(--key),30px 0 0 var(--key),45px 2px 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 10px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key);} 81% { box-shadow:15px 0 0 var(--key),30px 0 0 var(--key),45px 0 0 var(--key),60px 0 0 var(--key),75px 0 0 var(--key),90px 0 0 var(--key),22px 10px 0 var(--key),37px 12px 0 var(--key),52px 10px 0 var(--key),60px 10px 0 var(--key),68px 10px 0 var(--key),83px 10px 0 var(--key);} }
      `}</style>
    </div>
  );
};

export default Loader;
