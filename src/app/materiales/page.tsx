'use client';

import React, { useState, useEffect } from 'react';
import MaterialImportModal from '@/components/MaterialImportModal';
import PhotoLightboxModal from '@/components/PhotoLightboxModal';

interface MaterialSKU {
  id: number;
  sku: string;
  descripcion: string;
  cliente: string;
  entradas: number;
  salidas: number;
  disponible: number;
}

interface HistorialSKU {
  entradas: { id: number; fecha: string; cantidadCajas: number; lpn: string; recepcionId: number; fotos: string[] }[];
  salidas: { id: number; fecha: string; cantidadCajas: number; lpn: string; salidaId: number; fotos: string[] }[];
  palletsInventario: { id: number; lpn: string; fecha: string; cantidadCajas: number; fotos: string[] }[];
}

export default function MaestroMaterialesPage() {
  const [materiales, setMateriales] = useState<MaterialSKU[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [mostrarModalImportar, setMostrarModalImportar] = useState(false);
  const [modalHistorial, setModalHistorial] = useState<{
    material: MaterialSKU;
    tipo: 'entradas' | 'salidas' | 'disponible';
    historial: HistorialSKU;
  } | null>(null);

  // Modal Visor de Fotos
  const [modalFotos, setModalFotos] = useState<{ titulo: string; subtitulo: string; fotos: string[] } | null>(null);

  // Formulario Nuevo SKU Individual
  const [sku, setSku] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const cargarMateriales = async () => {
    setCargando(true);
    try {
      const res = await fetch('http://localhost:4000/api/materiales');
      if (res.ok) setMateriales(await res.json());
    } catch (err) {
      console.log('Error cargando materiales:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMateriales();
  }, []);

  const handleCrearMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const res = await fetch('http://localhost:4000/api/materiales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, descripcion }),
      });
      if (res.ok) {
        setMostrarModalNuevo(false);
        setSku('');
        setDescripcion('');
        await cargarMateriales();
      } else {
        alert('❌ Error al crear material.');
      }
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const abrirHistorial = async (m: MaterialSKU, tipo: 'entradas' | 'salidas' | 'disponible') => {
    try {
      const res = await fetch(`http://localhost:4000/api/materiales/${m.id}/historial`);
      if (res.ok) {
        const historial: HistorialSKU = await res.json();
        setModalHistorial({ material: m, tipo, historial });
      }
    } catch (err) {
      console.error('Error cargando historial:', err);
    }
  };

  const materialesFiltrados = materiales.filter(
    (m) =>
      m.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.descripcion.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <main className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Principal */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl shadow-2xl">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Catálogo General de Productos</span>
          <h1 className="text-2xl font-black text-white mt-1">Maestro de Materiales & SKUs</h1>
          <p className="text-xs text-slate-400 mt-0.5">Control de entradas, salidas, existencias por SKU e historial con fotografías.</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setMostrarModalImportar(true)}
            className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-extrabold text-xs px-4 py-3 rounded-xl border border-emerald-500/40 transition-all active:scale-95 shadow-md flex items-center gap-2"
          >
            <span>📥</span> CARGA MASIVA CSV
          </button>

          <button
            onClick={() => setMostrarModalNuevo(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-cyan-900/30 transition-all active:scale-95 flex items-center gap-2"
          >
            <span>📦</span> + NUEVO SKU
          </button>
        </div>
      </header>

      {/* Barra de Filtros y Búsqueda */}
      <section className="glass-panel p-5 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full sm:w-80 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-2">
            <span className="text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar por código SKU o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-500"
            />
          </div>

          <div className="text-xs font-mono text-slate-400">
            Total Registros: <strong className="text-cyan-400 font-bold">{materialesFiltrados.length} SKUs</strong>
          </div>
        </div>
      </section>

      {/* Tabla Datatable de SKUs */}
      <section className="glass-panel rounded-3xl p-6 shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <th className="p-3">Código SKU</th>
              <th className="p-3">Descripción del Producto</th>
              <th className="p-3 text-center">Sumatoria Entradas</th>
              <th className="p-3 text-center">Sumatoria Salidas</th>
              <th className="p-3 text-right">Existencias Disponibles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {materialesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  {cargando ? 'Cargando catálogo...' : 'No se encontraron materiales en el catálogo.'}
                </td>
              </tr>
            ) : (
              materialesFiltrados.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-extrabold text-cyan-400">{m.sku}</td>
                  <td className="p-3 text-white font-semibold">{m.descripcion}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => abrirHistorial(m, 'entradas')}
                      className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-mono font-bold px-3 py-1 rounded-full border border-sky-500/30 transition-all text-xs"
                    >
                      📥 {m.entradas || 0} cjas
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => abrirHistorial(m, 'salidas')}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono font-bold px-3 py-1 rounded-full border border-amber-500/30 transition-all text-xs"
                    >
                      🚚 {m.salidas || 0} cjas
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => abrirHistorial(m, 'disponible')}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-mono font-black px-3.5 py-1 rounded-full border border-emerald-500/30 transition-all text-xs"
                    >
                      🏬 {m.disponible || 0} cjas
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Componente Modal Carga Masiva CSV */}
      {mostrarModalImportar && (
        <MaterialImportModal
          onClose={() => setMostrarModalImportar(false)}
          onSuccess={cargarMateriales}
        />
      )}

      {/* Componente Lightbox Galería Fotográfica */}
      {modalFotos && (
        <PhotoLightboxModal
          titulo={modalFotos.titulo}
          subtitulo={modalFotos.subtitulo}
          fotos={modalFotos.fotos}
          onClose={() => setModalFotos(null)}
        />
      )}

      {/* MODAL HISTORIAL INTERACTIVO Y FOTOGRAFÍAS */}
      {modalHistorial && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 p-6 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-white">
                  Historial de {modalHistorial.tipo.toUpperCase()}: <span className="text-cyan-400 font-mono">{modalHistorial.material.sku}</span>
                </h3>
                <p className="text-xs text-slate-400">{modalHistorial.material.descripcion}</p>
              </div>
              <button onClick={() => setModalHistorial(null)} className="text-slate-400 hover:text-white font-bold text-sm bg-slate-800 px-3 py-1.5 rounded-xl">
                ✕
              </button>
            </div>

            <div className="p-2 overflow-y-auto flex-1 space-y-3 text-xs">
              {modalHistorial.tipo === 'entradas' &&
                modalHistorial.historial.entradas.map((e) => (
                  <div key={e.id} className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <span className="font-extrabold text-white text-sm">Entrada #{e.id} — Pallet {e.lpn}</span>
                      <p className="text-slate-400 font-mono mt-0.5">Recepción #{e.recepcionId} • {new Date(e.fecha).toLocaleString()}</p>
                      <p className="text-cyan-400 font-bold mt-1">📦 {e.cantidadCajas} cajas recibidas</p>
                    </div>
                    {e.fotos && e.fotos.length > 0 && (
                      <button
                        onClick={() => setModalFotos({ titulo: `Entrada #${e.id}`, subtitulo: `LPN ${e.lpn}`, fotos: e.fotos })}
                        className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 font-bold px-3 py-2 rounded-xl border border-cyan-500/30 transition-all shrink-0"
                      >
                        📷 Fotos ({e.fotos.length})
                      </button>
                    )}
                  </div>
                ))}

              {modalHistorial.tipo === 'salidas' &&
                modalHistorial.historial.salidas.map((s) => (
                  <div key={s.id} className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <span className="font-extrabold text-white text-sm">Salida #{s.salidaId} — Pallet {s.lpn}</span>
                      <p className="text-slate-400 font-mono mt-0.5">{new Date(s.fecha).toLocaleString()}</p>
                      <p className="text-amber-400 font-bold mt-1">🚚 {s.cantidadCajas} cajas despachadas</p>
                    </div>
                    {s.fotos && s.fotos.length > 0 && (
                      <button
                        onClick={() => setModalFotos({ titulo: `Salida #${s.salidaId}`, subtitulo: `LPN ${s.lpn}`, fotos: s.fotos })}
                        className="bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 font-bold px-3 py-2 rounded-xl border border-amber-500/30 transition-all shrink-0"
                      >
                        📷 Fotos ({s.fotos.length})
                      </button>
                    )}
                  </div>
                ))}

              {modalHistorial.tipo === 'disponible' &&
                modalHistorial.historial.palletsInventario.map((p) => (
                  <div key={p.id} className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <span className="font-extrabold text-white text-sm">Pallet LPN {p.lpn} (EN INVENTARIO)</span>
                      <p className="text-slate-400 font-mono mt-0.5">Ingresado: {new Date(p.fecha).toLocaleString()}</p>
                      <p className="text-emerald-400 font-bold mt-1">🏬 {p.cantidadCajas} cajas disponibles en rack</p>
                    </div>
                    {p.fotos && p.fotos.length > 0 && (
                      <button
                        onClick={() => setModalFotos({ titulo: `Tarima LPN ${p.lpn}`, subtitulo: `Stock Disponible`, fotos: p.fotos })}
                        className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-bold px-3 py-2 rounded-xl border border-emerald-500/30 transition-all shrink-0"
                      >
                        📷 Fotos ({p.fotos.length})
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR NUEVO SKU INDIVIDUAL */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Alta de Nuevo Producto (SKU)</h3>
                <p className="text-xs text-slate-400">Registrar nuevo material individual en el catálogo.</p>
              </div>
              <button onClick={() => setMostrarModalNuevo(false)} className="text-slate-400 hover:text-white font-bold text-sm bg-slate-800 px-3 py-1 rounded-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearMaterial} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Código SKU *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. SKU-ELEC-005"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Descripción del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cámara Digital 4K Sensor CMOS 24MP"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {cargando ? 'Guardando...' : 'GUARDAR SKU EN CATÁLOGO'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
