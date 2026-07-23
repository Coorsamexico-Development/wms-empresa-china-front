'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch, getApiUrl } from '@/lib/apiFetch';
import PhotoLightboxModal from '@/components/PhotoLightboxModal';

interface Atributo {
  id: number;
  nombre: string;
  tipoDato: string;
  requerido: boolean;
}

interface Material {
  id: number;
  sku: string;
  descripcion: string;
  cliente: string;
}

interface DetalleTarima {
  id: number;
  materialId: number;
  material?: Material;
  cantidadCajas: number;
}

interface Tarima {
  id: number;
  recepcionId: number;
  lpnCodigo: string;
  estado: string;
  detalles: DetalleTarima[];
}

interface UnidadRecepcion {
  id: number;
  estado: string;
  fechaCreacion: string;
  creador?: { nombreCompleto: string };
  atributos?: { id: number; atributo?: { nombre: string }; valor: string }[];
  evidencias?: { id: number; urlArchivo: string; tipoEvidencia?: { nombre: string } }[];
  tarimas?: Tarima[];
}

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<UnidadRecepcion[]>([]);
  const [catalogoMateriales, setCatalogoMateriales] = useState<Material[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // MODAL 1: REGISTRO DE UNIDAD
  const [mostrarModalUnidad, setMostrarModalUnidad] = useState(false);
  const [atributosCatalogo, setAtributosCatalogo] = useState<Atributo[]>([]);
  const [valoresAtributos, setValoresAtributos] = useState<Record<number, string>>({});
  const [fotosUnidad, setFotosUnidad] = useState<string[]>([]);

  // MODAL 2: LISTA DE PALLETS DE LA UNIDAD
  const [unidadPaletizar, setUnidadPaletizar] = useState<UnidadRecepcion | null>(null);
  const [tarimasUnidad, setTarimasUnidad] = useState<Tarima[]>([]);

  // MODAL 3 (SECUNDARIO): EDICIÓN Y DETALLE DEL PALLET SELECCIONADO
  const [palletEditar, setPalletEditar] = useState<Tarima | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | ''>('');
  const [cantidadCajas, setCantidadCajas] = useState<number>(40);
  const [fotoPallet, setFotoPallet] = useState<string | null>(null);

  // MODAL ETIQUETA
  const [modalEtiqueta, setModalEtiqueta] = useState<{ lpn: string; zpl: string; tarimaId: number } | null>(null);

  // MODAL VISOR FOTOS DE UNIDAD DE VIAJE
  const [modalFotosUnidad, setModalFotosUnidad] = useState<{ titulo: string; subtitulo: string; fotos: string[] } | null>(null);

  // Cargar Unidades, Atributos y Catálogo de Materiales
  const cargarUnidades = async () => {
    setCargando(true);
    try {
      const res = await apiFetch('/api/inbound/recepciones');
      if (res.ok) setUnidades(await res.json());

      const resAttr = await apiFetch('/api/inbound/atributos');
      if (resAttr.ok) setAtributosCatalogo(await resAttr.json());

      const resMat = await apiFetch('/api/materiales');
      if (resMat.ok) {
        const matData = await resMat.json();
        setCatalogoMateriales(matData);
        if (matData.length > 0 && !selectedMaterialId) {
          setSelectedMaterialId(matData[0].id);
        }
      }
    } catch (err) {
      console.log('Error cargando datos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUnidades();
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

  const handleFotoUnidad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file);
    setFotosUnidad((prev) => [...prev, dataUrl]);
  };

  const handleFotoPallet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file);
    setFotoPallet(dataUrl);
  };

  // 1. GUARDAR LLEGADA DE UNIDAD
  const handleGuardarUnidad = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const payloadAtributos = Object.entries(valoresAtributos).map(([attrId, val]) => ({
      atributoId: Number(attrId),
      valor: val,
    }));

    try {
      const res = await apiFetch('/api/inbound/recepciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creadoPor: 1, atributos: payloadAtributos }),
      });

      if (res.ok) {
        const nuevaUnidad = await res.json();
        for (const fotoUrl of fotosUnidad) {
          await apiFetch(`/api/inbound/recepciones/${nuevaUnidad.id}/evidencias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipoEvidenciaId: 1, urlArchivo: fotoUrl, subidoPor: 1 }),
          });
        }
        setMensaje(`✅ Unidad #${nuevaUnidad.id} registrada exitosamente.`);
        setMostrarModalUnidad(false);
        setValoresAtributos({});
        setFotosUnidad([]);
        await cargarUnidades();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // 2. ABRIR MODAL DE LISTA DE PALLETS DE LA UNIDAD
  const handleAbrirPaletizado = async (unidad: UnidadRecepcion) => {
    setUnidadPaletizar(unidad);
    try {
      const res = await apiFetch(`/api/paletizado/recepcion/${unidad.id}`);
      if (res.ok) {
        const list: Tarima[] = await res.json();
        setTarimasUnidad(list);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Crear Nuevo Pallet
  const handleCrearPallet = async () => {
    if (!unidadPaletizar) return;
    setCargando(true);
    try {
      const res = await apiFetch('/api/paletizado/tarimas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recepcionId: unidadPaletizar.id, armadoPor: 1 }),
      });
      if (res.ok) {
        const nuevaTarima: Tarima = await res.json();
        setPalletEditar(nuevaTarima);
        if (unidadPaletizar) await handleAbrirPaletizado(unidadPaletizar);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // Soft Delete de un Pallet
  const handleEliminarPallet = async (tarimaId: number, lpnCodigo: string) => {
    if (!confirm(`¿Está seguro de desactivar el pallet ${lpnCodigo}? Se aplicará Soft Delete y no se tomará en cuenta en los indicadores de stock.`)) {
      return;
    }
    setCargando(true);
    try {
      const res = await apiFetch(`/api/paletizado/tarimas/${tarimaId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (unidadPaletizar) await handleAbrirPaletizado(unidadPaletizar);
        await cargarUnidades();
      } else {
        alert('❌ Error al eliminar el pallet.');
      }
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  // Cerrar Recepción / Recibo de Unidad
  const handleCerrarRecepcion = async () => {
    if (!unidadPaletizar) return;
    setCargando(true);
    try {
      const res = await apiFetch(`/api/inbound/recepciones/${unidadPaletizar.id}/cerrar`, {
        method: 'POST',
      });

      if (res.ok) {
        const unidadCerrada = await res.json();
        setMensaje(`🎉 ¡Recepción #${unidadCerrada.id} completada exitosamente! Todos los pallets están en inventario.`);
        setUnidadPaletizar(null);
        await cargarUnidades();
      } else {
        const errJson = await res.json();
        alert(`❌ ${errJson.message || 'No se pudo cerrar la recepción.'}`);
      }
    } catch (err: any) {
      alert(`❌ Error al conectar con el servidor: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  // Abrir Modal Secundario para un Pallet Existente
  const handleAbrirDetallePallet = async (tarima: Tarima) => {
    try {
      const res = await apiFetch(`/api/paletizado/tarimas/${tarima.id}`);
      if (res.ok) {
        setPalletEditar(await res.json());
      } else {
        setPalletEditar(tarima);
      }
    } catch (err) {
      setPalletEditar(tarima);
    }
  };

  // Agregar Producto al Pallet (Modal Secundario)
  const handleAgregarProductoAPallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!palletEditar) return;
    if (!selectedMaterialId) {
      alert('⚠️ Seleccione un producto del catálogo.');
      return;
    }
    if (cantidadCajas <= 0) {
      alert('⚠️ Ingrese una cantidad de cajas mayor a 0.');
      return;
    }

    try {
      const res = await apiFetch(`/api/paletizado/tarimas/${palletEditar.id}/detalles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: Number(selectedMaterialId),
          cantidadCajas: Number(cantidadCajas),
          registradoPor: 1,
        }),
      });

      if (res.ok) {
        const resT = await apiFetch(`/api/paletizado/tarimas/${palletEditar.id}`);
        if (resT.ok) setPalletEditar(await resT.json());
        if (unidadPaletizar) await handleAbrirPaletizado(unidadPaletizar);
      } else {
        const errJson = await res.json();
        alert(`❌ Error: ${errJson.message || 'No se pudo agregar el producto'}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Eliminar detalle del Pallet (Soft Delete)
  const handleEliminarDetallePallet = async (detalleId: number) => {
    if (!palletEditar) return;
    try {
      await apiFetch(`/api/paletizado/detalles/${detalleId}`, { method: 'DELETE' });
      const resT = await apiFetch(`/api/paletizado/tarimas/${palletEditar.id}`);
      if (resT.ok) setPalletEditar(await resT.json());
      if (unidadPaletizar) await handleAbrirPaletizado(unidadPaletizar);
    } catch (err) {
      console.error(err);
    }
  };

  // Cerrar Pallet con foto obligatoria
  const handleCerrarPallet = async () => {
    if (!palletEditar) return;
    if (!fotoPallet) {
      alert('⚠️ Debe tomar o subir la fotografía del pallet antes de cerrarlo.');
      return;
    }

    setCargando(true);
    try {
      const res = await apiFetch(`/api/paletizado/tarimas/${palletEditar.id}/cierre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlFotografia: fotoPallet, cerradoPor: 1 }),
      });

      if (res.ok) {
        const cerrada = await res.json();
        setFotoPallet(null);
        setPalletEditar(null);

        const resZpl = await apiFetch(`/api/paletizado/tarimas/${cerrada.id}/etiqueta/zpl`);
        if (resZpl.ok) {
          const zplData = await resZpl.json();
          setModalEtiqueta({ lpn: cerrada.lpnCodigo, zpl: zplData.zpl, tarimaId: cerrada.id });
        }

        if (unidadPaletizar) await handleAbrirPaletizado(unidadPaletizar);
        await cargarUnidades();
      } else {
        const errJson = await res.json();
        alert(`❌ No se pudo cerrar el pallet: ${errJson.message || 'Error en el servidor'}`);
      }
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Principal */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl shadow-2xl">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Recepción & Paletizado</span>
          <h1 className="text-2xl font-black text-white mt-1">Gestión de Unidades de Transporte</h1>
          <p className="text-xs text-slate-400 mt-0.5">Histórico de llegadas, captura de datos y armado de pallets/tarimas LPN.</p>
        </div>

        <button
          onClick={() => setMostrarModalUnidad(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl shadow-lg shadow-cyan-900/30 transition-all active:scale-95 flex items-center gap-2"
        >
          <span>🚚</span> RECIBIR UNIDAD
        </button>
      </header>

      {mensaje && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-md">
          <span>{mensaje}</span>
          <button onClick={() => setMensaje(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Datatable Histórico de Unidades */}
      <section className="glass-panel rounded-3xl p-6 shadow-xl overflow-x-auto">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 mb-4">Histórico de Unidades Recibidas</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <th className="p-3">ID Unidad</th>
              <th className="p-3">Fecha y Hora</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Datos de la Unidad (Placas / Operador / Sello)</th>
              <th className="p-3">Pallets Armados</th>
              <th className="p-3 text-right">Acciones Operativas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {unidades.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500">
                  {cargando ? 'Cargando datos...' : 'No hay unidades registradas. Dé clic en "Recibir Unidad".'}
                </td>
              </tr>
            ) : (
              unidades.map((uni) => (
                <tr key={uni.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <button
                      onClick={() => {
                        const fotos = uni.evidencias?.map((e) => e.urlArchivo).filter(Boolean) || [];
                        const infoSub = uni.atributos?.map((a) => `${a.atributo?.nombre}: ${a.valor}`).join(' • ') || '';
                        setModalFotosUnidad({
                          titulo: `Viaje / Unidad de Transporte #${uni.id}`,
                          subtitulo: infoSub,
                          fotos,
                        });
                      }}
                      className="bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 font-mono font-black text-xs px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                    >
                      <span>📷</span> Unidad #{uni.id}
                    </button>
                  </td>
                  <td className="p-3 text-slate-300">{new Date(uni.fechaCreacion).toLocaleString()}</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        uni.estado === 'COMPLETADA'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {uni.estado}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="space-y-0.5">
                      {uni.atributos?.map((attr) => (
                        <div key={attr.id} className="text-[11px]">
                          <span className="text-slate-400 font-semibold">{attr.atributo?.nombre}: </span>
                          <span className="text-white font-bold">{attr.valor}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-indigo-300">
                    🏷️ {uni.tarimas?.length || 0} Pallets
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleAbrirPaletizado(uni)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 ml-auto"
                    >
                      <span>📦</span> RECIBIR / PALETIZAR
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* ================================================================================= */}
      {/* MODAL 1: FORMULARIO REGISTRO DE UNIDAD */}
      {/* ================================================================================= */}
      {mostrarModalUnidad && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-slate-900 border border-slate-750 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 shrink-0 bg-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Recibir Nueva Unidad de Transporte</h3>
                <p className="text-xs text-slate-400">Captura de datos de llegada y fotografías iniciales.</p>
              </div>
              <button onClick={() => setMostrarModalUnidad(false)} className="text-slate-400 hover:text-white font-bold text-lg bg-slate-800 px-3 py-1 rounded-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarUnidad} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {atributosCatalogo.map((attr) => (
                <div key={attr.id} className="space-y-1">
                  <label className="font-bold text-slate-300 flex justify-between">
                    <span>{attr.nombre}</span>
                    {attr.requerido && <span className="text-rose-400 text-[10px] uppercase font-bold">* Requerido</span>}
                  </label>
                  <input
                    type="text"
                    required={attr.requerido}
                    placeholder={`Ej. Ingrese ${attr.nombre.toLowerCase()}`}
                    value={valoresAtributos[attr.id] || ''}
                    onChange={(e) => setValoresAtributos({ ...valoresAtributos, [attr.id]: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                  />
                </div>
              ))}

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="font-bold text-cyan-400 block">Fotografías Iniciales de la Unidad</label>
                <label className="relative overflow-hidden bg-slate-800 hover:bg-slate-750 text-slate-200 border border-dashed border-slate-600 rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer">
                  <input type="file" accept="image/*" capture="environment" onChange={handleFotoUnidad} className="absolute opacity-0 cursor-pointer" />
                  <span className="text-xl">📷</span>
                  <span className="text-xs font-bold text-cyan-300">Tomar / Subir Foto de Unidad</span>
                </label>

                {fotosUnidad.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {fotosUnidad.map((f, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden border border-slate-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f} alt={`Unidad Foto ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 sticky bottom-0 bg-slate-900 pb-1">
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  {cargando ? 'Guardando...' : 'GUARDAR LLEGADA DE UNIDAD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================================= */}
      {/* MODAL 2 PRINCIPAL: LISTA DE PALLETS DE LA UNIDAD (AMPLIADO max-w-5xl) */}
      {/* ================================================================================= */}
      {unidadPaletizar && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Modal Ancho */}
            <div className="p-6 border-b border-slate-800 shrink-0 bg-slate-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Estación de Paletizado</span>
                <h3 className="text-2xl font-black text-white mt-0.5">Pallets de la Unidad #{unidadPaletizar.id}</h3>
                <p className="text-xs text-slate-400">
                  {unidadPaletizar.atributos?.map((a) => `${a.atributo?.nombre}: ${a.valor}`).join(' • ')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Botón CERRAR RECIBO */}
                {unidadPaletizar.estado !== 'COMPLETADA' && (
                  <button
                    onClick={handleCerrarRecepcion}
                    disabled={cargando}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5 border border-emerald-400/40"
                  >
                    <span>🔒</span> CERRAR RECIBO / UNIDAD
                  </button>
                )}

                <button onClick={() => setUnidadPaletizar(null)} className="text-slate-400 hover:text-white font-bold text-lg bg-slate-800 px-3.5 py-1.5 rounded-xl">
                  ✕ Cerrar
                </button>
              </div>
            </div>

            {/* Cuerpo Modal 1 */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Botón Masivo Crear Pallet */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-white">Armado y Gestión de Pallets LPN</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Haga clic en "+ Crear Nuevo Pallet" para abrir el formulario de estibado o seleccione un pallet existente.
                  </p>
                </div>
                <button
                  onClick={handleCrearPallet}
                  disabled={cargando || unidadPaletizar.estado === 'COMPLETADA'}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs px-6 py-3.5 rounded-xl shadow-lg transition-all active:scale-95 shrink-0 flex items-center gap-2 disabled:opacity-40"
                >
                  <span>📦</span> + CREAR NUEVO PALLET (LPN)
                </button>
              </div>

              {/* Datatable / Lista Ancha de Pallets Creados */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                    Pallets Registrados en esta Unidad ({tarimasUnidad.length})
                  </h4>
                  <span className="text-[11px] text-cyan-400 font-semibold">
                    Dé clic en "Editar" para estibar o "Eliminar" para descartar (Soft Delete)
                  </span>
                </div>

                {tarimasUnidad.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">
                    No hay pallets creados en esta unidad. Dé clic en "+ Crear Nuevo Pallet" arriba.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          <th className="p-3">Código LPN</th>
                          <th className="p-3">Estado</th>
                          <th className="p-3">Cajas Estibadas</th>
                          <th className="p-3">Referencias SKUs</th>
                          <th className="p-3 text-right">Acciones Operativas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {tarimasUnidad.map((t) => {
                          const totalCajas = t.detalles?.reduce((acc, d) => acc + d.cantidadCajas, 0) || 0;
                          return (
                            <tr key={t.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="p-3 font-mono font-black text-cyan-300 text-sm">{t.lpnCodigo}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    t.estado === 'EN_INVENTARIO'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  {t.estado}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-white text-sm">{totalCajas} cajas</td>
                              <td className="p-3 text-slate-400">
                                {t.detalles?.map((d) => `[${d.material?.sku}]`).join(', ') || 'Sin productos'}
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    onClick={() => handleAbrirDetallePallet(t)}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow transition-all active:scale-95 flex items-center gap-1"
                                  >
                                    <span>✏️</span> Editar / Detalle
                                  </button>

                                  <a
                                    href={getApiUrl(`/api/paletizado/tarimas/${t.id}/etiqueta/pdf`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                                  >
                                    <span>📄</span> PDF
                                  </a>

                                  <button
                                    onClick={async () => {
                                      try {
                                        const resZpl = await apiFetch(`/api/paletizado/tarimas/${t.id}/etiqueta/zpl`);
                                        if (resZpl.ok) {
                                          const zData = await resZpl.json();
                                          await navigator.clipboard.writeText(zData.zpl);
                                          alert(`¡Código ZPL para ${t.lpnCodigo} copiado!`);
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                                  >
                                    <span>🖨️</span> ZPL
                                  </button>

                                  {/* Botón SOFT DELETE PALLET */}
                                  <button
                                    onClick={() => handleEliminarPallet(t.id, t.lpnCodigo)}
                                    className="bg-rose-900/40 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                                  >
                                    <span>🗑️</span> Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================================= */}
      {/* MODAL 3 (SECUNDARIO DEDICADO): EDICIÓN Y DETALLE DE UN PALLET */}
      {/* ================================================================================= */}
      {palletEditar && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Modal Secundario */}
            <div className="p-5 border-b border-slate-800 shrink-0 bg-slate-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Detalle & Edición de Pallet</span>
                <div className="flex items-center gap-3 mt-0.5">
                  <h3 className="text-xl font-mono font-black text-white">{palletEditar.lpnCodigo}</h3>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      palletEditar.estado === 'EN_INVENTARIO'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {palletEditar.estado}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setPalletEditar(null)}
                className="text-slate-400 hover:text-white font-bold text-sm bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700"
              >
                ✕ Regresar a Lista
              </button>
            </div>

            {/* Cuerpo Modal Secundario Escroleable */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Formulario Especificar Productos y Cajas */}
              {palletEditar.estado === 'EN_ARMADO' ? (
                <form onSubmit={handleAgregarProductoAPallet} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    1. Especificar Producto del Catálogo y Cantidad de Cajas
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 block">Producto del Catálogo *</label>
                      <select
                        value={selectedMaterialId}
                        onChange={(e) => setSelectedMaterialId(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      >
                        {catalogoMateriales.length === 0 ? (
                          <option value="">No hay productos en catálogo</option>
                        ) : (
                          catalogoMateriales.map((m) => (
                            <option key={m.id} value={m.id}>
                              [{m.sku}] {m.descripcion} ({m.cliente})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 block">Cantidad Cajas *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={cantidadCajas}
                        onChange={(e) => setCantidadCajas(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-center font-bold text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    + AGREGAR AL PALLET {palletEditar.lpnCodigo}
                  </button>
                </form>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-400 block">✓ Pallet Cerrado en Inventario</span>
                    <span className="text-slate-300">Este pallet ya cuenta con su evidencia fotográfica y etiqueta asignada.</span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={getApiUrl(`/api/paletizado/tarimas/${palletEditar.id}/etiqueta/pdf`)}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl"
                    >
                      📄 PDF
                    </a>
                  </div>
                </div>
              )}

              {/* Lista del Contenido del Pallet */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    2. Contenido del Pallet ({palletEditar.detalles?.length || 0} referencias)
                  </h4>
                  <span className="text-xs font-black text-cyan-400">
                    Total Cajas: {palletEditar.detalles?.reduce((acc, curr) => acc + curr.cantidadCajas, 0) || 0}
                  </span>
                </div>

                {(!palletEditar.detalles || palletEditar.detalles.length === 0) ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Pallet sin productos. Seleccione un producto arriba y dé clic en "+ Agregar".</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {palletEditar.detalles.map((det) => (
                      <div key={det.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white block">
                            {det.cantidadCajas} Cajas • <span className="text-cyan-300">{det.material?.sku}</span>
                          </span>
                          <span className="text-slate-400 text-[11px]">{det.material?.descripcion}</span>
                        </div>
                        {palletEditar.estado === 'EN_ARMADO' && (
                          <button onClick={() => handleEliminarDetallePallet(det.id)} className="text-rose-400 hover:text-rose-300 font-bold p-1">
                            🗑️ Quitar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cierre Fotográfico de Pallet */}
              {palletEditar.estado === 'EN_ARMADO' && (
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    3. Fotografía Obligatoria y Cierre de Pallet
                  </h4>

                  <label className="relative overflow-hidden bg-slate-900 hover:bg-slate-850 text-slate-200 border border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer">
                    <input type="file" accept="image/*" capture="environment" onChange={handleFotoPallet} className="absolute opacity-0 cursor-pointer" />
                    <span className="text-2xl">📷</span>
                    <span className="text-xs font-bold text-amber-300">
                      {fotoPallet ? '✓ Foto de Pallet Lista (Cambiar)' : 'Tomar / Subir Fotografía del Pallet Armado'}
                    </span>
                  </label>

                  {fotoPallet && (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-amber-500/40 max-h-44">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fotoPallet} alt="Foto Pallet" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <button
                    onClick={handleCerrarPallet}
                    disabled={cargando || !fotoPallet || !palletEditar.detalles || palletEditar.detalles.length === 0}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-sm py-4 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-40"
                  >
                    🔒 CERRAR PALLET Y GENERAR ETIQUETA LPN
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ETIQUETA GENERADA */}
      {modalEtiqueta && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl text-center">
            <span className="text-4xl">🏷️</span>
            <h3 className="text-lg font-black text-white">Etiqueta Pallet Generada</h3>
            <p className="text-xs font-mono text-cyan-400">{modalEtiqueta.lpn}</p>

            <div className="space-y-2">
              <a
                href={getApiUrl(`/api/paletizado/tarimas/${modalEtiqueta.tarimaId}/etiqueta/pdf`)}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>📄</span> DESCARGAR ETIQUETA EN PDF
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(modalEtiqueta.zpl);
                  alert('¡Código ZPL copiado al portapapeles para impresora Zebra!');
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <span>🖨️</span> COPIAR ZPL PARA ZEBRA
              </button>
            </div>

            <button
              onClick={() => setModalEtiqueta(null)}
              className="w-full bg-slate-950 text-slate-400 hover:text-white text-xs py-2 rounded-xl border border-slate-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX FOTOS DE LA UNIDAD */}
      {modalFotosUnidad && (
        <PhotoLightboxModal
          titulo={modalFotosUnidad.titulo}
          subtitulo={modalFotosUnidad.subtitulo}
          fotos={modalFotosUnidad.fotos}
          onClose={() => setModalFotosUnidad(null)}
        />
      )}
    </main>
  );
}
