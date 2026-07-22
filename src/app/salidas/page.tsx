'use client';

import React, { useState, useEffect } from 'react';

interface TarimaDisponible {
  id: number;
  lpnCodigo: string;
  estado: string;
  detalles?: { id: number; cantidadCajas: number; material?: { sku: string; descripcion: string } }[];
}

interface SalidaDespacho {
  id: number;
  estado: string;
  fechaCreacion: string;
  creador?: { nombreCompleto: string };
  atributos?: { id: number; atributo?: { nombre: string }; valor: string }[];
  detalles?: { id: number; tarima?: TarimaDisponible }[];
  evidencias?: { id: number; urlArchivo: string }[];
}

export default function SalidasPage() {
  const [salidas, setSalidas] = useState<SalidaDespacho[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // MODAL 1: REGISTRO DE NUEVA SALIDA
  const [mostrarModalNuevaSalida, setMostrarModalNuevaSalida] = useState(false);
  const [operador, setOperador] = useState('');
  const [placas, setPlacas] = useState('');
  const [destino, setDestino] = useState('');
  const [sello, setSello] = useState('');

  // MODAL 2: SELECCIÓN DE PALLETS Y EVIDENCIA FOTOGRÁFICA
  const [salidaActiva, setSalidaActiva] = useState<SalidaDespacho | null>(null);
  const [tarimasDisponibles, setTarimasDisponibles] = useState<TarimaDisponible[]>([]);
  const [tarimasSeleccionadas, setTarimasSeleccionadas] = useState<number[]>([]);
  const [fotoCarga, setFotoCarga] = useState<string | null>(null);

  const cargarSalidas = async () => {
    setCargando(true);
    try {
      const res = await fetch('http://localhost:4000/api/salidas');
      if (res.ok) setSalidas(await res.json());

      const resTarimas = await fetch('http://localhost:4000/api/salidas/tarimas-disponibles');
      if (resTarimas.ok) setTarimasDisponibles(await resTarimas.json());
    } catch (err) {
      console.log('Error cargando salidas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSalidas();
  }, []);

  // Compresión Canvas HTML5
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1000;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = (h * maxDim) / w;
            w = maxDim;
          } else if (h > maxDim) {
            w = (w * maxDim) / h;
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleFotoCarga = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file);
    setFotoCarga(dataUrl);
  };

  // Crear Nueva Orden de Salida
  const handleGuardarSalida = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      const res = await fetch('http://localhost:4000/api/salidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creadoPor: 1,
          atributos: [
            { atributoId: 1, valor: operador || 'Operador Despacho' },
            { atributoId: 2, valor: placas || 'Placas Salida' },
            { atributoId: 3, valor: destino || 'Destino Central' },
            { atributoId: 4, valor: sello || 'Sello Salida' },
          ],
        }),
      });

      if (res.ok) {
        const nueva = await res.json();
        setMensaje(`✅ Orden de Salida #${nueva.id} registrada.`);
        setMostrarModalNuevaSalida(false);
        setOperador('');
        setPlacas('');
        setDestino('');
        setSello('');
        await cargarSalidas();
        setSalidaActiva(nueva);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // Checkbox Toggle para Selección de Pallets
  const handleToggleTarima = (id: number) => {
    if (tarimasSeleccionadas.includes(id)) {
      setTarimasSeleccionadas(tarimasSeleccionadas.filter((tId) => tId !== id));
    } else {
      setTarimasSeleccionadas([...tarimasSeleccionadas, id]);
    }
  };

  // Confirmar Despacho y Cierre de Salida
  const handleConfirmarDespacho = async () => {
    if (!salidaActiva) return;
    if (tarimasSeleccionadas.length === 0) {
      alert('⚠️ Debe seleccionar al menos un pallet del inventario para despachar.');
      return;
    }
    if (!fotoCarga) {
      alert('⚠️ Debe tomar o subir la fotografía de la carga antes de confirmar la salida.');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch(`http://localhost:4000/api/salidas/${salidaActiva.id}/despachar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tarimaIds: tarimasSeleccionadas,
          urlFotografia: fotoCarga,
          despachadoPor: 1,
        }),
      });

      if (res.ok) {
        setMensaje(`🎉 ¡Salida #${salidaActiva.id} despachada exitosamente con ${tarimasSeleccionadas.length} pallets!`);
        setSalidaActiva(null);
        setTarimasSeleccionadas([]);
        setFotoCarga(null);
        await cargarSalidas();
      } else {
        const errJson = await res.json();
        alert(`❌ Error al procesar despacho: ${errJson.message}`);
      }
    } catch (err: any) {
      alert(`❌ Error en servidor: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Principal */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-md">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Outbound & Logística</span>
          <h1 className="text-2xl font-black text-white mt-1">Salidas & Despacho de Transporte</h1>
          <p className="text-xs text-slate-400 mt-0.5">Selección de pallets en inventario y registro de evidencias de salida.</p>
        </div>

        <button
          onClick={() => setMostrarModalNuevaSalida(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl shadow-lg shadow-amber-900/30 transition-all active:scale-95 flex items-center gap-2"
        >
          <span>🚛</span> NUEVA ORDEN DE SALIDA
        </button>
      </header>

      {mensaje && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md">
          <span>{mensaje}</span>
          <button onClick={() => setMensaje(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Datatable Histórico de Salidas */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-x-auto">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4">Histórico de Órdenes de Despacho</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <th className="p-3">ID Salida</th>
              <th className="p-3">Fecha y Hora</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Datos del Transporte (Operador / Placas / Destino)</th>
              <th className="p-3">Pallets Despachados</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {salidas.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500">
                  {cargando ? 'Cargando órdenes de despacho...' : 'No hay salidas registradas. Dé clic en "Nueva Orden de Salida".'}
                </td>
              </tr>
            ) : (
              salidas.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-extrabold text-amber-400">Salida #{s.id}</td>
                  <td className="p-3 text-slate-300">{new Date(s.fechaCreacion).toLocaleString()}</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        s.estado === 'EN_PROCESO'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {s.estado}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="space-y-0.5">
                      {s.atributos?.map((attr) => (
                        <div key={attr.id} className="text-[11px]">
                          <span className="text-slate-400 font-semibold">{attr.atributo?.nombre}: </span>
                          <span className="text-white font-bold">{attr.valor}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-sky-300">
                    📦 {s.detalles?.length || 0} Pallets
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSalidaActiva(s)}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 ml-auto"
                    >
                      <span>🚛</span> {s.estado === 'EN_PROCESO' ? 'DESPACHAR UNIDAD' : 'VER VERIFICACIÓN'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* MODAL 1: REGISTRO DE TRANSPORTE DE SALIDA */}
      {mostrarModalNuevaSalida && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 shrink-0 bg-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Registrar Orden de Salida</h3>
                <p className="text-xs text-slate-400">Captura de datos del vehículo y operador de despacho.</p>
              </div>
              <button onClick={() => setMostrarModalNuevaSalida(false)} className="text-slate-400 hover:text-white font-bold text-lg bg-slate-800 px-3 py-1 rounded-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarSalida} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Nombre del Operador *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pedro Ramírez"
                  value={operador}
                  onChange={(e) => setOperador(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Placas del Transporte *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 98-XYZ-3"
                  value={placas}
                  onChange={(e) => setPlacas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Destino / Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Almacén Distribución Guadalajara"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Número de Sello de Salida *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. S-998811"
                  value={sello}
                  onChange={(e) => setSello(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 sticky bottom-0 bg-slate-900">
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-lg transition-all active:scale-95"
                >
                  CREAR ORDEN DE SALIDA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SELECCIÓN DE PALLETS Y EVIDENCIA FOTOGRÁFICA DE SALIDA */}
      {salidaActiva && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 shrink-0 bg-slate-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Estación de Despacho</span>
                <h3 className="text-xl font-black text-white mt-0.5">Despacho de Unidad Salida #{salidaActiva.id}</h3>
                <p className="text-xs text-slate-400">Seleccione los pallets en inventario que abordarán esta unidad y capture la evidencia de carga.</p>
              </div>
              <button onClick={() => setSalidaActiva(null)} className="text-slate-400 hover:text-white font-bold text-lg bg-slate-800 px-3 py-1 rounded-xl">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Lista de Pallets Disponibles en Inventario */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      1. Seleccionar Pallets del Inventario (Disponibles: {tarimasDisponibles.length})
                    </h4>
                    <p className="text-[11px] text-slate-400">Marque las casillas de los pallets que serán cargados en esta salida.</p>
                  </div>
                  <span className="text-xs font-extrabold text-amber-400">
                    {tarimasSeleccionadas.length} Pallets Seleccionados
                  </span>
                </div>

                {tarimasDisponibles.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No hay pallets disponibles en inventario (`EN_INVENTARIO`). Reciba unidades y cierre pallets primero.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {tarimasDisponibles.map((t) => {
                      const seleccionada = tarimasSeleccionadas.includes(t.id);
                      const totalCajas = t.detalles?.reduce((acc, d) => acc + d.cantidadCajas, 0) || 0;
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleToggleTarima(t.id)}
                          className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            seleccionada
                              ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/40 text-white'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-amber-400">{t.lpnCodigo}</span>
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
                                EN_INVENTARIO
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-1">
                              {totalCajas} cajas • {t.detalles?.map((d) => d.material?.sku).join(', ')}
                            </span>
                          </div>
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs border ${
                            seleccionada ? 'bg-amber-500 border-amber-400 text-black' : 'bg-slate-950 border-slate-700 text-transparent'
                          }`}>
                            ✓
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Fotografía de Evidencia de Carga */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  2. Fotografía Obligatoria de Carga (Puertas Abiertas / Camión Cargado)
                </h4>

                <label className="relative overflow-hidden bg-slate-900 hover:bg-slate-850 text-slate-200 border border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer">
                  <input type="file" accept="image/*" capture="environment" onChange={handleFotoCarga} className="absolute opacity-0 cursor-pointer" />
                  <span className="text-2xl">📷</span>
                  <span className="text-xs font-bold text-amber-300">
                    {fotoCarga ? '✓ Foto de Carga Lista (Cambiar)' : 'Tomar / Subir Fotografía del Camión Cargado'}
                  </span>
                </label>

                {fotoCarga && (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-amber-500/40 max-h-44">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fotoCarga} alt="Foto Carga" className="w-full h-full object-cover" />
                  </div>
                )}

                <button
                  onClick={handleConfirmarDespacho}
                  disabled={cargando || !fotoCarga || tarimasSeleccionadas.length === 0}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-sm py-4 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-40"
                >
                  🔒 CONFIRMAR SALIDA Y DESPACHO DE TRANSPORTE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
