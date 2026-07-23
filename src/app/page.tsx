'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';

interface HistoricoMes {
  mesKey: string;
  labelMes: string;
  entradasCajas: number;
  entradasTarimas: number;
  salidasCajas: number;
  salidasTarimas: number;
  ocupacionCajas: number;
}

interface DashboardKpis {
  totalRecepciones: number;
  recepcionesEnDescarga: number;
  tarimasEnInventario: number;
  tarimasEnArmado: number;
  tarimasDespachadas: number;
  cajasEnInventario: number;
  totalEntradas: number;
  totalSalidas: number;
  existencias: number;
  historicoMensual: HistoricoMes[];
}

import { apiFetch } from '@/lib/apiFetch';

export default function DashboardHome() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('');
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes'>('mes');

  const chartRef = useRef<HTMLDivElement>(null);

  const cargarKpis = async (mesKey?: string, pParam?: string) => {
    setCargando(true);
    try {
      const p = pParam || periodo;
      let endpoint = `/api/dashboard/kpis?periodo=${p}`;
      if (mesKey) endpoint += `&mes=${mesKey}`;
      const res = await apiFetch(endpoint);
      if (res.ok) {
        const data: DashboardKpis = await res.json();
        setKpis(data);
        if (data.historicoMensual && data.historicoMensual.length > 0) {
          setMesSeleccionado(data.historicoMensual[data.historicoMensual.length - 1].mesKey);
        }
      }
    } catch (err) {
      console.error('Error cargando KPIs:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleCambiarPeriodo = (nuevoPeriodo: 'dia' | 'semana' | 'mes') => {
    setPeriodo(nuevoPeriodo);
    cargarKpis(undefined, nuevoPeriodo);
  };

  useEffect(() => {
    cargarKpis();
  }, []);

  // amCharts 5 Rendering
  useLayoutEffect(() => {
    if (!chartRef.current || !kpis || !kpis.historicoMensual) return;

    const root = am5.Root.new(chartRef.current);
    root.setThemes([am5themes_Animated.new(root), am5themes_Dark.new(root)]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        wheelX: 'panX',
        wheelY: 'zoomX',
        layout: root.verticalLayout,
      }),
    );

    const cursor = chart.set('cursor', am5xy.XYCursor.new(root, {}));
    cursor.lineY.set('visible', false);

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'labelMes',
        renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 30 }),
        tooltip: am5.Tooltip.new(root, {}),
      }),
    );

    xAxis.data.setAll(kpis.historicoMensual);

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
      }),
    );

    // Serie Entradas
    const seriesEntradas = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Entradas (Cajas)',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'entradasCajas',
        categoryXField: 'labelMes',
        tooltip: am5.Tooltip.new(root, {
          labelText: 'Entradas: {valueY} cajas',
        }),
      }),
    );
    seriesEntradas.columns.template.setAll({
      cornerRadiusTL: 8,
      cornerRadiusTR: 8,
      fill: am5.color(0x06b6d4),
      stroke: am5.color(0x0284c7),
    });
    seriesEntradas.data.setAll(kpis.historicoMensual);

    // Serie Salidas
    const seriesSalidas = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Salidas (Cajas)',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'salidasCajas',
        categoryXField: 'labelMes',
        tooltip: am5.Tooltip.new(root, {
          labelText: 'Salidas: {valueY} cajas',
        }),
      }),
    );
    seriesSalidas.columns.template.setAll({
      cornerRadiusTL: 8,
      cornerRadiusTR: 8,
      fill: am5.color(0xf59e0b),
      stroke: am5.color(0xd97706),
    });
    seriesSalidas.data.setAll(kpis.historicoMensual);

    // Serie Ocupación
    const seriesOcupacion = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: 'Ocupación Neta',
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: 'ocupacionCajas',
        categoryXField: 'labelMes',
        stroke: am5.color(0x10b981),
        tooltip: am5.Tooltip.new(root, {
          labelText: 'Ocupación: {valueY} cajas',
        }),
      }),
    );

    seriesOcupacion.strokes.template.setAll({ strokeWidth: 3 });
    seriesOcupacion.bullets.push(() =>
      am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 5,
          fill: am5.color(0x10b981),
        }),
      }),
    );
    seriesOcupacion.data.setAll(kpis.historicoMensual);

    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
      }),
    );
    legend.data.setAll(chart.series.values);

    chart.set('scrollbarX', am5.Scrollbar.new(root, { orientation: 'horizontal' }));

    return () => {
      root.dispose();
    };
  }, [kpis]);

  const datosMesActual = kpis?.historicoMensual?.find((m) => m.mesKey === mesSeleccionado);

  return (
    <main className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Principal del Dashboard */}
      <header className="glass-panel p-6 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-cyan-500 via-indigo-500 to-emerald-500" />
        <div className="pl-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Control Operativo de Almacén</span>
          <h1 className="text-2xl font-black text-white mt-0.5">Dashboard & Indicadores KPIs</h1>
          <p className="text-xs text-slate-400 mt-1">Visibilidad en tiempo real de inventarios, cajas, pallets LPN y movimientos mensuales.</p>
        </div>

        <button
          onClick={() => cargarKpis(mesSeleccionado)}
          disabled={cargando}
          className="bg-slate-900/90 hover:bg-slate-800 border border-slate-750 text-slate-200 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          {cargando ? 'Cargando...' : '🔄 Actualizar Métricas'}
        </button>
      </header>

      {/* SECCIÓN 1: INDICADORES PRINCIPALES DE STOCK ACTUAL */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Tarjeta 1: Cajas Disponibles */}
        <div className="glass-panel glass-panel-hover p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Cajas en Stock Actual</span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl text-cyan-400 shadow-md">
              🏬
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3 tracking-tight">
            {kpis?.cajasEnInventario ? kpis.cajasEnInventario.toLocaleString() : 0}
          </p>
          <p className="text-[10px] text-cyan-400/90 font-semibold mt-1">Sumatoria total en almacén</p>
        </div>

        {/* Tarjeta 2: Tarimas LPN */}
        <div className="glass-panel glass-panel-hover p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tarimas LPN en Stock</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-xl text-indigo-400 shadow-md">
              🏷️
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3 tracking-tight">
            {kpis?.tarimasEnInventario ? kpis.tarimasEnInventario.toLocaleString() : 0}
          </p>
          <p className="text-[10px] text-indigo-400/90 font-semibold mt-1">Pallets listos en inventario</p>
        </div>

        {/* Tarjeta 3: Total Entradas */}
        <div className="glass-panel glass-panel-hover p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Entradas Acumuladas</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl text-emerald-400 shadow-md">
              📥
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3 tracking-tight">
            {kpis?.totalEntradas ? kpis.totalEntradas.toLocaleString() : 0}
          </p>
          <p className="text-[10px] text-emerald-400/90 font-semibold mt-1">Total cajas ingresadas</p>
        </div>

        {/* Tarjeta 4: Total Salidas */}
        <div className="glass-panel glass-panel-hover p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Salidas Acumuladas</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl text-amber-400 shadow-md">
              🚚
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-3 tracking-tight">
            {kpis?.totalSalidas ? kpis.totalSalidas.toLocaleString() : 0}
          </p>
          <p className="text-[10px] text-amber-400/90 font-semibold mt-1">Total cajas despachadas</p>
        </div>
      </section>

      {/* SECCIÓN 2: SELECTOR DE MES Y DESGLOSE OPERACIONAL */}
      <section className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>📅</span> Desglose Operacional Mensual
            </h2>
            <p className="text-xs text-slate-400">Filtre las entradas y salidas específicas del mes seleccionado.</p>
          </div>

          {/* Month Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Mes:</span>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-cyan-400 font-extrabold text-xs px-4 py-2 rounded-xl focus:outline-none focus:border-cyan-500 shadow-sm"
            >
              {kpis?.historicoMensual?.map((m) => (
                <option key={m.mesKey} value={m.mesKey}>
                  {m.labelMes}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumen del Mes Seleccionado */}
        {datosMesActual ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Entradas del Mes</span>
              <p className="text-xl font-black text-cyan-400 mt-1">{datosMesActual.entradasCajas.toLocaleString()} Cajas</p>
              <span className="text-[10px] text-slate-500 font-mono">({datosMesActual.entradasTarimas} Tarimas LPN)</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Salidas del Mes</span>
              <p className="text-xl font-black text-amber-400 mt-1">{datosMesActual.salidasCajas.toLocaleString()} Cajas</p>
              <span className="text-[10px] text-slate-500 font-mono">({datosMesActual.salidasTarimas} Tarimas LPN)</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Variación / Ocupación</span>
              <p className="text-xl font-black text-emerald-400 mt-1">+{datosMesActual.ocupacionCajas.toLocaleString()} Cajas</p>
              <span className="text-[10px] text-slate-500 font-mono">(Balance Neto del Mes)</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-500">Seleccione un mes para consultar detalles.</div>
        )}
      </section>

      {/* SECCIÓN 3: GRÁFICA DE MOVIMIENTOS */}
      <section className="glass-panel p-6 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>📊</span> Gráfica de Movimientos
            </h3>
            <p className="text-xs text-slate-400">
              Evolución comparativa de Entradas, Salidas y Ocupación acumulada en el período seleccionado.
            </p>
          </div>

          {/* Selector de Período: Día, Semana, Mes */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => handleCambiarPeriodo('dia')}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                periodo === 'dia'
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📅 Día
            </button>
            <button
              onClick={() => handleCambiarPeriodo('semana')}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                periodo === 'semana'
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📆 Semana
            </button>
            <button
              onClick={() => handleCambiarPeriodo('mes')}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                periodo === 'mes'
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🗓️ Mes
            </button>
          </div>
        </div>

        {/* Contenedor Lienzo amCharts 5 */}
        <div ref={chartRef} className="w-full h-96 rounded-2xl overflow-hidden bg-slate-950/80 border border-slate-800/90 p-2 shadow-inner" />
      </section>
    </main>
  );
}
