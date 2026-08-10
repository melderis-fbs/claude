'use client';
import { useState, useCallback } from 'react';

const fmt = n => n == null ? '—' : `$${Math.round(n).toLocaleString('es-AR')}`;
const pct = n => n == null ? '—' : `${n.toFixed(1)}%`;


function EgresosDiag() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const tabsRes = await fetch('/api/egresos').then(r => r.json());
      const dataRes = await fetch('/api/egresos?tab=Consolidado').then(r => r.json());
      const rawRes  = await fetch('/api/egresos?tab=Consolidado&raw=1').then(r => r.json());
      const primerRow = dataRes.data?.[0] ?? null;
      const columnas  = primerRow ? Object.keys(primerRow).filter(k => k !== '_rowIndex') : [];
      setResult({
        urlConfigured: tabsRes.urlConfigured,
        tabsDisponibles: tabsRes.tabs,
        rowCount: Array.isArray(dataRes.data) ? dataRes.data.length : '?',
        columnas,
        rawError: dataRes.error,
        rawGas: rawRes.rawGas ?? JSON.stringify(rawRes).slice(0, 600),
      });
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-gray-500 text-sm">Sin datos de egresos. Verificá que:</p>
      <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
        <li>La variable <code className="bg-gray-100 px-1 rounded">APPS_SCRIPT_EGRESOS_URL</code> esté configurada en Vercel</li>
        <li>La pestaña se llame exactamente <strong>Consolidado</strong></li>
        <li>La primera columna sea <strong>Categoria</strong> y las demás <strong>Enero</strong>, <strong>Febrero</strong>…</li>
      </ul>
      <button onClick={check} disabled={loading}
        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-medium transition-colors disabled:opacity-50">
        {loading ? 'Consultando…' : '🔍 Verificar conexión'}
      </button>
      {result && (
        <div className="space-y-2 text-xs">
          {result.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 font-medium">
              ❌ {result.error}
            </div>
          )}
          <div className={`rounded-lg px-3 py-2 ${result.urlConfigured ? 'bg-gray-900 text-white' : 'bg-red-50 text-red-600'}`}>
            {result.urlConfigured
              ? '✓ APPS_SCRIPT_EGRESOS_URL configurada'
              : '❌ APPS_SCRIPT_EGRESOS_URL no está configurada en Vercel'}
          </div>
          {result.rawError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600">
              ❌ GAS error: {result.rawError}
            </div>
          )}
          {Array.isArray(result.tabsDisponibles) && result.tabsDisponibles.length > 0 && (
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <span className="font-semibold text-gray-600">Pestañas: </span>
              <span className="text-gray-500">{result.tabsDisponibles.join(', ')}</span>
            </div>
          )}
          {result.columnas?.length > 0 && (
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="font-semibold text-gray-600 mb-1">Columnas en "Consolidado":</p>
              <p className="text-gray-500 break-all">{result.columnas.join(' · ')}</p>
            </div>
          )}
          {result.urlConfigured && result.columnas?.length === 0 && !result.rawError && (
            <div className="space-y-2">
              <div className="bg-stone-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700">
                ⚠️ GAS devuelve {result.rowCount} filas. Respuesta RAW del GAS:
              </div>
              <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 break-all whitespace-pre-wrap overflow-x-auto max-h-48">{result.rawGas}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Monocromático: neutra por defecto; variant="dark" resalta en gris muy oscuro.
function Card({ label, value, sub, color = 'blue', variant = 'plain' }) {
  const dark = variant === 'dark';
  return (
    <div className={`rounded-xl border p-5 ${dark ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{sub}</p>}
    </div>
  );
}


function ROASSection({ mes, anunciosPorMes = {} }) {
  const d = anunciosPorMes[mes] ?? {};
  const fmtX    = v => v != null ? `${Number(v).toFixed(2)}x` : '—';
  const fmtCost = v => v != null ? `$${Number(v).toFixed(2)}`  : '—';

  const item = (label, value, hint) => (
    <div>
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{hint}</p>
    </div>
  );

  return (
    <div className="bg-gray-900 border border-gray-900 rounded-xl p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Meta Ads — ROAS</p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {item('Inversión Meta', d.inversion != null ? fmt(d.inversion) : '—', 'gasto publicitario')}
        {item('ROAS', fmtX(d.roas), 'ventas auto / inversión')}
        {item('ROAS Cash', fmtX(d.roasCash), 'cobros auto / inversión')}
        {item('Costo por lead', fmtCost(d.costoLead), 'inversión / leads')}
        {item('Costo por agenda', fmtCost(d.costoAgenda), 'inversión / agendas')}
      </div>
    </div>
  );
}

export default function ResumenEconomico({ resumen, cobranzas = [], cobrosSemanales, ventasPorMes = [], cobrosAutomatica = {}, anunciosPorMes = {}, pendientesPorMes = {} }) {
  const [mesSel, setMesSel] = useState(resumen[resumen.length - 1]?.mes ?? '');
  const m = resumen.find(r => r.mes === mesSel) ?? resumen[resumen.length - 1];
  const [genPDF, setGenPDF] = useState(false);
  const [genErr, setGenErr] = useState('');

  const cobradoSemana  = cobrosSemanales.filter(c => c.pagado).reduce((a,c) => a+c.monto, 0);
  const esperadoSemana = cobrosSemanales.reduce((a,c) => a+c.monto, 0);

  if (!m) return <p className="text-gray-400 text-sm">Sin datos disponibles.</p>;

  // Cobranza de cuotas = cobrado ÷ lo que vencía en cuotas ese mes (cuotas 2ª-4ª).
  // Viene de calcularCobranzas (aCobrar / cobrado / pctCobrado) por mes de vencimiento.
  const cuo = cobranzas.find(c => c.mes === mesSel) || null;

  // Genera el informe PDF a partir de los datos YA calculados que están en
  // pantalla (no vuelve a leer la planilla).
  async function generarInforme() {
    setGenPDF(true); setGenErr('');
    try {
      const payload = {
        label: m.label,
        emitido: new Date().toLocaleDateString('es-AR'),
        m,
        cuo,
        resumen,
        cobranzas,
        anuncio: anunciosPorMes[mesSel] || {},
        ventaMes: ventasPorMes.find(v => v.mes === mesSel) || null,
        // proyección: sólo meses futuros respecto al mes seleccionado
        pendientesPorMes: Object.fromEntries(
          Object.entries(pendientesPorMes).filter(([k]) => k >= mesSel)
        ),
      };
      const res = await fetch('/api/informe/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe-FoundersBS-${(m.label || 'mes').replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setGenErr(e.message);
    } finally {
      setGenPDF(false);
    }
  }

  const hayCostos = Object.keys(m.costos).length > 0;
  const totalVentasConMet = (m.ventasAR || 0) + (m.ventasExt || 0) + (m.ventasEfectivo || 0);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Selector de mes + Generar informe */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 font-medium">Mes:</span>
        {resumen.map(r => (
          <button key={r.mes} onClick={() => setMesSel(r.mes)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              r.mes === mesSel
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {r.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {genErr && <span className="text-xs text-red-600">{genErr}</span>}
          <button onClick={generarInforme} disabled={genPDF}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-60 flex items-center gap-2">
            {genPDF ? 'Generando…' : '📄 Generar informe'}
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card label="Ventas nuevas"         value={(m.ventasNuevas || 0) + (m.ventasBack || 0)} sub={`${m.ventasNuevas || 0} nuevas · ${m.ventasBack || 0} back`} />
        <Card label="Monto total ventas"    value={fmt((m.montoFront || 0) + (m.montoBack || 0))} sub={`front ${fmt(m.montoFront)} · back ${fmt(m.montoBack)}`} />
        <Card label="Recolección total"     value={fmt(m.cashTotal)} sub={`venta nueva ${fmt((m.cashNuevoAR||0)+(m.cashNuevoExt||0)+(m.cashNuevoEfectivo||0))} · cuotas ${fmt(m.cashCuotaTotal || 0)}`} variant="dark" />
        <Card label="Ganancia"              value={fmt(m.ganancia)} sub={hayCostos ? `Rent. ${pct(m.rentabilidad)}` : 'Sin datos de costos'} variant="dark" />
        <Card label="Recolección venta nueva" value={pct(m.pctCC)} sub="primeros pagos ÷ venta del mes" />
        <Card label="Cobranza de cuotas"    value={cuo ? pct(cuo.pctCobrado) : '—'} sub={cuo ? `${fmt(cuo.cobrado)} ÷ ${fmt(cuo.aCobrar)} que vencía` : 'cobrado ÷ lo que vencía'} />
        <Card label="Costos del mes"        value={hayCostos ? fmt(m.totalCostos) : '—'} sub={hayCostos ? pct(m.montoTotal > 0 ? (m.totalCostos / m.montoTotal) * 100 : 0) + ' de ventas' : 'Sin datos de costos'} />
        <Card label="Cobros esta semana"    value={fmt(cobradoSemana)} sub={`de ${fmt(esperadoSemana)} esperados`} />
      </div>

      {/* Meta Ads / ROAS */}
      <ROASSection mes={mesSel} anunciosPorMes={anunciosPorMes} />

      {/* Detalle del mes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Ventas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Ventas — {m.label}</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Ventas nuevas</span>
              <span className="font-semibold text-gray-900">{m.ventasNuevas}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Ventas back</span>
              <span className="font-semibold text-gray-900">{m.ventasBack}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Monto front</span>
              <span className="font-semibold text-gray-900">{fmt(m.montoFront)}</span>
            </div>
            <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Monto back</span>
              <span className="font-semibold text-gray-900">{fmt(m.montoBack)}</span>
            </div>

            {/* Argentina / Exterior / Efectivo */}
            {totalVentasConMet > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Origen de ventas nuevas</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-stone-50 rounded-lg px-3 py-2 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">Argentina</p>
                    <p className="text-sm font-bold text-gray-900">{m.ventasAR || 0} ventas</p>
                    <p className="text-xs text-gray-500">{fmt(m.montoAR || 0)}</p>
                  </div>
                  <div className="bg-stone-50 rounded-lg px-3 py-2 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">Exterior</p>
                    <p className="text-sm font-bold text-gray-900">{m.ventasExt || 0} ventas</p>
                    <p className="text-xs text-gray-500">{fmt(m.montoExt || 0)}</p>
                  </div>
                  <div className="bg-stone-50 rounded-lg px-3 py-2 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">Efectivo</p>
                    <p className="text-sm font-bold text-gray-900">{m.ventasEfectivo || 0} ventas</p>
                    <p className="text-xs text-gray-500">{fmt(m.montoEfectivo || 0)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recolección detallada */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recolección — {m.label}</h3>

          {/* Progreso desglosado: pagos de venta nueva vs. cuotas */}
          <div className="mb-5 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-500">Pagos de venta nueva <span className="text-gray-400">(primeros pagos ÷ venta del mes)</span></span>
                <span className="font-bold text-gray-900">{pct(m.pctCC)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-2 bg-gray-900 rounded-full transition-all" style={{ width: `${Math.min(m.pctCC || 0, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-500">Cobranza de cuotas <span className="text-gray-400">(cobrado ÷ lo que vencía)</span></span>
                <span className="font-bold text-gray-900">{cuo ? pct(cuo.pctCobrado) : '—'}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-2 bg-gray-900 rounded-full transition-all" style={{ width: `${Math.min(cuo?.pctCobrado || 0, 100)}%` }} />
              </div>
              {cuo && (
                <p className="text-xs text-gray-400 mt-1">{fmt(cuo.cobrado)} cobrado · {fmt(cuo.aCobrar)} vencía{cuo.pendiente > 0 ? ` · ${fmt(cuo.pendiente)} pendiente` : ''}</p>
              )}
            </div>
          </div>

          {/* Matriz AR / Exterior / Efectivo */}
          <table className="w-full text-sm mb-4">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2"></th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2">Argentina</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2">Exterior</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2">Efectivo</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 text-gray-500">Primer pagos</td>
                <td className="py-2 text-right font-medium text-gray-700">{fmt(m.cashNuevoAR || 0)}</td>
                <td className="py-2 text-right font-medium text-gray-700">{fmt(m.cashNuevoExt || 0)}</td>
                <td className="py-2 text-right font-medium text-gray-700">{fmt(m.cashNuevoEfectivo || 0)}</td>
                <td className="py-2 text-right font-semibold text-gray-900">{fmt((m.cashNuevoAR || 0) + (m.cashNuevoExt || 0) + (m.cashNuevoEfectivo || 0))}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-500">Cuotas</td>
                <td className="py-2 text-right font-medium text-gray-700">{fmt(m.cashCuotaAR || 0)}</td>
                <td className="py-2 text-right font-medium text-gray-700">{fmt(m.cashCuotaExt || 0)}</td>
                <td className="py-2 text-right font-medium text-gray-700">{fmt(m.cashCuotaEfectivo || 0)}</td>
                <td className="py-2 text-right font-semibold text-gray-900">{fmt(m.cashCuotaTotal || 0)}</td>
              </tr>
              <tr className="border-t-2 border-gray-200">
                <td className="py-2 font-semibold text-gray-700">Total</td>
                <td className="py-2 text-right font-bold text-gray-900">{fmt(m.cashTotalAR || 0)}</td>
                <td className="py-2 text-right font-bold text-gray-900">{fmt(m.cashTotalExt || 0)}</td>
                <td className="py-2 text-right font-bold text-gray-900">{fmt(m.cashTotalEfectivo || 0)}</td>
                <td className="py-2 text-right font-bold text-gray-900 text-base">{fmt(m.cashTotal)}</td>
              </tr>
            </tbody>
          </table>

          <p className="text-xs text-gray-400">
            Pago full: <span className="font-medium text-gray-600">{fmt(m.cashNuevoFull || 0)}</span>
            <span className="mx-2">·</span>
            Financiado: <span className="font-medium text-gray-600">{fmt(m.cashNuevoFinanciado || 0)}</span>
          </p>
        </div>

        {/* Costos */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Costos — {m.label}</h3>
          {hayCostos ? (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {Object.entries(m.costos).map(([cat, val]) => {
                  const pctVal = m.montoTotal > 0 ? (val / m.montoTotal) * 100 : 0;
                  return (
                    <tr key={cat}>
                      <td className="py-2 text-gray-500">{cat}</td>
                      <td className="py-2 text-right font-medium text-gray-800">{fmt(val)}</td>
                      <td className="py-2 text-right text-gray-400 w-14">{pct(pctVal)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-gray-300 font-semibold">
                  <td className="py-2 text-gray-900">TOTAL COSTOS</td>
                  <td className="py-2 text-right text-gray-900">{fmt(m.totalCostos)}</td>
                  <td className="py-2 text-right text-gray-500">{m.montoTotal > 0 ? pct((m.totalCostos / m.montoTotal) * 100) : '—'}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <EgresosDiag />
          )}
        </div>

        {/* Resultado */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Resultado — {m.label}</h3>
          <div className="space-y-3">
            <div className={`rounded-lg p-4 ${m.ganancia >= 0 ? 'bg-gray-900 border border-gray-900' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-xs mb-1 ${m.ganancia >= 0 ? 'text-gray-400' : 'text-gray-500'}`}>Ganancia (todas las ventas)</p>
              <p className={`text-3xl font-bold ${m.ganancia >= 0 ? 'text-white' : 'text-red-700'}`}>{fmt(m.ganancia)}</p>
            </div>
            <div className="bg-stone-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Rentabilidad</p>
              <p className="text-3xl font-bold text-gray-900">{hayCostos ? pct(m.rentabilidad) : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Histórico mensual</h3>
        </div>
        <table className="w-full text-sm min-w-max">
          <thead className="bg-gray-50">
            <tr>
              {['Mes','Ventas','Monto Front','Arg / Ext','Recolección','% cobro','Costos','Ganancia','Rent.'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...resumen].reverse().map(r => (
              <tr key={r.mes} onClick={() => setMesSel(r.mes)}
                className={`cursor-pointer transition-colors ${r.mes === mesSel ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                <td className="px-5 py-3 font-semibold text-gray-800">{r.label}</td>
                <td className="px-5 py-3 text-gray-600">{r.ventasNuevas} nuevas · {r.ventasBack} back</td>
                <td className="px-5 py-3 text-gray-700">{fmt(r.montoFront)}</td>
                <td className="px-5 py-3 text-gray-600">
                  <span className="text-gray-700">{r.ventasAR || 0} AR</span>
                  <span className="text-gray-300 mx-1">/</span>
                  <span className="text-gray-700">{r.ventasExt || 0} Ext</span>
                </td>
                <td className="px-5 py-3 text-gray-700">{fmt(r.cashTotal)}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.pctCC>=80?'bg-gray-900 text-white':r.pctCC>=50?'bg-gray-200 text-gray-700':'bg-red-100 text-red-700'}`}>
                    {pct(r.pctCC)}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-700">{fmt(r.totalCostos)}</td>
                <td className={`px-5 py-3 font-semibold ${r.ganancia>=0?'text-gray-900':'text-red-600'}`}>{fmt(r.ganancia)}</td>
                <td className="px-5 py-3 text-gray-600">{Object.keys(r.costos).length>0?pct(r.rentabilidad):'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
