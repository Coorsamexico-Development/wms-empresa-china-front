'use client';

import React, { useState, useEffect } from 'react';
import PhotoLightboxModal from '@/components/PhotoLightboxModal';

interface EventoAuditoria {
  id: string;
  fecha: string;
  categoria: 'ENTRADA' | 'PALETIZADO' | 'SALIDA';
  tipoEvento: string;
  descripcion: string;
  detalles: string;
  usuario: string;
  fotos: string[];
}

export default function VisorTrazabilidadPage() {
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [cargando, setCargando] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');

  // Modal Visor de Fotos
  const [modalFotos, setModalFotos] = useState<{ titulo: string; fotos: string[] } | null>(null);

  const cargarEventos = async () => {
    setCargando(true);
    try {
      const res = await fetch('http://localhost:4000/api/dashboard/trazabilidad');
      if (res.ok) {
        setEventos(await res.json());
      }
    } catch (err) {
      console.log('Error cargando bitácora de eventos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  // Filtrado dinámico
  const eventosFiltrados = eventos.filter((ev) => {
    const coincideCategoria = filtroCategoria === 'TODOS' || ev.categoria === filtroCategoria;
    const q = busqueda.toLowerCase();
    const coincideBusqueda =
      !busqueda ||
      ev.tipoEvento.toLowerCase().includes(q) ||
      ev.descripcion.toLowerCase().includes(q) ||
      ev.detalles.toLowerCase().includes(q) ||
      ev.usuario.toLowerCase().includes(q);
    return coincideCategoria && coincideBusqueda;
  });

  return (
    <main className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Principal */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl shadow-2xl">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Auditoría & Trazabilidad WMS</span>
          <h1 className="text-2xl font-black text-white mt-1">Bitácora Cronológica de Eventos</h1>
          <p className="text-xs text-slate-400 mt-0.5">Historial completo de creaciones, entradas, paletizado, salidas y fotografías de evidencia.</p>
        </div>

        <button
          onClick={cargarEventos}
          disabled={cargando}
          className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-extrabold text-xs px-4 py-3 rounded-xl border border-slate-750 transition-colors shadow-md active:scale-95 flex items-center gap-2"
        >
          {cargando ? 'Cargando...' : '🔄 Actualizar Bitácora'}
        </button>
      </header>

      {/* Controles de Filtros y Búsqueda */}
      <section className="glass-panel p-5 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Botones de Categorías */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setFiltroCategoria('TODOS')}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                filtroCategoria === 'TODOS' ? 'bg-cyan-600 text-white shadow-md font-black' : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🌐 TODOS ({eventos.length})
            </button>
            <button
              onClick={() => setFiltroCategoria('ENTRADA')}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                filtroCategoria === 'ENTRADA' ? 'bg-sky-600 text-white shadow-md font-black' : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🚚 ENTRADAS ({eventos.filter((e) => e.categoria === 'ENTRADA').length})
            </button>
            <button
              onClick={() => setFiltroCategoria('PALETIZADO')}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                filtroCategoria === 'PALETIZADO' ? 'bg-emerald-600 text-white shadow-md font-black' : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              📦 PALETIZADO LPN ({eventos.filter((e) => e.categoria === 'PALETIZADO').length})
            </button>
            <button
              onClick={() => setFiltroCategoria('SALIDA')}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                filtroCategoria === 'SALIDA' ? 'bg-amber-600 text-white shadow-md font-black' : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🚛 SALIDAS ({eventos.filter((e) => e.categoria === 'SALIDA').length})
            </button>
          </div>

          {/* Buscador de Eventos */}
          <div className="w-full sm:w-72 bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 rounded-xl flex items-center gap-2">
            <span className="text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar por LPN, placas, operador..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-500"
            />
          </div>
        </div>
      </section>

      {/* Stream / Línea de Tiempo de Eventos Cronológicos */}
      <section className="space-y-4">
        {eventosFiltrados.length === 0 ? (
          <div className="py-12 text-center text-slate-500 glass-panel rounded-3xl">
            {cargando ? 'Cargando registros de auditoría...' : 'No se encontraron eventos en la bitácora.'}
          </div>
        ) : (
          eventosFiltrados.map((ev) => {
            let colorBadge = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
            if (ev.categoria === 'ENTRADA') colorBadge = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
            if (ev.categoria === 'PALETIZADO') colorBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
            if (ev.categoria === 'SALIDA') colorBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';

            return (
              <div
                key={ev.id}
                className="glass-panel glass-panel-hover p-5 rounded-3xl shadow-lg transition-all space-y-3"
              >
                {/* Header Evento */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${colorBadge}`}>
                      {ev.categoria}
                    </span>
                    <h3 className="text-sm font-black text-white">{ev.tipoEvento}</h3>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span>👤 Registrado por: <strong className="text-slate-200">{ev.usuario}</strong></span>
                    <span>🕒 {new Date(ev.fecha).toLocaleString()}</span>
                  </div>
                </div>

                {/* Detalle del Evento */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 max-w-3xl">
                    <p className="text-slate-200 font-semibold">{ev.descripcion}</p>
                    <p className="text-slate-400 font-mono">{ev.detalles}</p>
                  </div>

                  {/* Botón Galería de Fotos */}
                  {ev.fotos && ev.fotos.length > 0 ? (
                    <button
                      onClick={() => setModalFotos({ titulo: ev.tipoEvento, fotos: ev.fotos })}
                      className="bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 active:scale-95 shadow-md"
                    >
                      <span>📷</span> Ver Evidencias ({ev.fotos.length})
                    </button>
                  ) : (
                    <span className="text-slate-500 text-[11px] italic shrink-0">Sin fotografía adjunta</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Componente Lightbox Galería Fotográfica */}
      {modalFotos && (
        <PhotoLightboxModal
          titulo={modalFotos.titulo}
          fotos={modalFotos.fotos}
          onClose={() => setModalFotos(null)}
        />
      )}
    </main>
  );
}
