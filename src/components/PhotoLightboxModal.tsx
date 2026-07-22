'use client';

import React from 'react';

interface PhotoLightboxModalProps {
  titulo: string;
  subtitulo?: string;
  fotos: string[];
  onClose: () => void;
}

export default function PhotoLightboxModal({ titulo, subtitulo, fotos, onClose }: PhotoLightboxModalProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[80] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-750 p-6 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>📷</span> Galería de Evidencia Fotográfica
            </h3>
            <p className="text-xs text-cyan-400 font-mono mt-0.5">{titulo} {subtitulo ? `• ${subtitulo}` : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Galería Fotográfica */}
        <div className="p-2 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fotos.map((fotoUrl, i) => (
            <div
              key={i}
              className="aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center relative group shadow-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fotoUrl}
                alt={`Evidencia Foto #${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
              />
              <span className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-md text-cyan-300 text-[10px] font-mono px-2.5 py-1 rounded-lg font-bold border border-white/10">
                Fotografía #{i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
