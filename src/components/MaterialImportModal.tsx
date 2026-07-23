'use client';

import React, { useState } from 'react';

import { apiFetch } from '@/lib/apiFetch';

interface MaterialImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function MaterialImportModal({ onClose, onSuccess }: MaterialImportModalProps) {
  const [archivoCsv, setArchivoCsv] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleDescargarEjemplo = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,SKU,Descripcion\nSKU-ELEC-100,Pantalla OLED 65 Ultra HD 120Hz\nSKU-ELEC-101,Barra de Sonido Soundbar 5.1 Subwoofer\nSKU-ELEC-102,Proyector Smart Portable Full HD 1080p';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ejemplo_carga_masiva_materiales.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCargaMasiva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoCsv) {
      alert('⚠️ Seleccione un archivo CSV para importar.');
      return;
    }

    setCargando(true);
    try {
      const text = await archivoCsv.text();
      const lineas = text.split('\n');
      const materiales: { sku: string; descripcion: string }[] = [];

      for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;
        const columnas = linea.split(',');
        if (columnas.length >= 2) {
          const sku = columnas[0].replace(/"/g, '').trim();
          const descripcion = columnas[1].replace(/"/g, '').trim();
          if (sku && descripcion) {
            materiales.push({ sku, descripcion });
          }
        }
      }

      if (materiales.length === 0) {
        alert('⚠️ El archivo CSV no contiene registros válidos.');
        return;
      }

      const res = await apiFetch('/api/materiales/carga-masiva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materiales }),
      });

      if (res.ok) {
        const json = await res.json();
        alert(`✅ Carga completada: ${json.creados || materiales.length} productos procesados en el catálogo.`);
        onSuccess();
        onClose();
      } else {
        alert('❌ Error al procesar la carga masiva.');
      }
    } catch (err: any) {
      alert(`❌ Error en carga de archivo: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-750 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-white">Importación Masiva por CSV</h3>
            <p className="text-xs text-slate-400">Carga masiva de SKUs al Maestro de Materiales.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-sm bg-slate-800 px-3 py-1 rounded-xl">
            ✕
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300">1. Descargar Plantilla de Ejemplo:</span>
            <button
              type="button"
              onClick={handleDescargarEjemplo}
              className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-extrabold px-3 py-1.5 rounded-lg border border-emerald-500/40 transition-all text-[11px]"
            >
              📥 Ejercicio CSV
            </button>
          </div>
          <p className="text-[10px] text-slate-500">Formato requerido: SKU, Descripcion (Sin columna de cliente).</p>
        </div>

        <form onSubmit={handleCargaMasiva} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1">2. Seleccionar Archivo CSV con Datos:</label>
            <input
              type="file"
              accept=".csv"
              required
              onChange={(e) => setArchivoCsv(e.target.files ? e.target.files[0] : null)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500 file:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {cargando ? 'Procesando Carga...' : 'IMPORTAR CATALOGO AHORA'}
          </button>
        </form>
      </div>
    </div>
  );
}
