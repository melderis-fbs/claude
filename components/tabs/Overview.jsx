'use client';
import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, Users } from 'lucide-react';
import CobranzasSection from '../ui/CobranzasSection.jsx';

function usd(n) { return '$ ' + Number(n || 0).toLocaleString('es-AR'); }

function ars(n) { return `$ ${Number(n || 0).toLocaleString('es-AR')}`; }
// Detecta automáticamente si el valor es fracción (0-1) o ya es porcentaje (>1)
function pct(n) {
  const v = Number(n || 0);
  const p = (v > 0 && v <= 1) ? v * 100 : v;
  return `${p.toFixed(1)}%`;
}
function dec1(n) { return Number(n || 0).toFixed(1); }

function BigCard({ bg, children }) {
  return (
    <div className={`rounded-xl p-4 ${bg}`}>
      {children}
    </div>
  );
}

export default function Overview({ negocio = [], anuncios = [], closers = [], selectedMonth, clientesNuevos = [], recoleccion = [] }) {
  const latestNegocio = useMemo(() => [...negocio].sort((a, b) => b.mes.localeCompare(a.mes))[0] || {}, [negocio]);
  const latestAds     = useMemo(() => [...anuncios].sort((a, b) => b.mes.localeCompare(a.mes))[0] || {}, [anuncios]);
  const mes        = useMemo(() => negocio.find(r => r.mes === selectedMonth) || latestNegocio, [negocio, selectedMonth, latestNegocio]);
  const mesAds     = useMemo(() => anuncios.find(r => r.mes === selectedMonth) || latestAds, [anuncios, selectedMonth, latestAds]);
  const mesClosers = useMemo(() => closers.filter(r => r.mes === selectedMonth), [closers, selectedMonth]);
  const topCloser  = useMemo(() => [...mesClosers].sort((a, b) => b.cierres - a.cierres)[0] || null, [mesClosers]);

  const totalCierres = mesClosers.reduce((s, c) => s + (c.cierres || 0), 0);
  const tasaCierre   = mesClosers.length > 0
    ? ((totalCierres / mesClosers.reduce((s, c) => s + (c.asistencias || 0), 0)) * 100 || 0).toFixed(1)
    : '0.0';

  const pctMeta = mes.objetivoPesos > 0
    ? Math.min(100, ((mes.ventasTotal || 0) / mes.objetivoPesos) * 100)
    : 0;

  const alertas = useMemo(() => {
    const list = [];
    if (!mes.mes) return list;
    const faltante = mes.faltanteObj || 0;
    const obj = mes.objetivoPesos || 0;
    if (obj > 0 && pctMeta < 50) {
      const diasMes = 30;
      const diasPasados = Math.max(1, new Date().getDate());
      const diasRestantes = Math.max(1, diasMes - diasPasados);
      const diario = faltante / diasRestantes;
      list.push({
        color: 'red',
        title: `Objetivo mensual — ${ars(obj)} por recaudar`,
        body: `Se recaudó el ${pctMeta.toFixed(0)}% del objetivo. Se necesitan ~${ars(diario)}/día para llegar.`,
      });
    }
    const tc = parseFloat(tasaCierre);
    if (tc < 20 && totalCierres >= 0 && mesClosers.length > 0) {
      list.push({
        color: 'orange',
        title: `Tasa de cierre baja: ${tasaCierre}%`,
        body: 'La conversión está por debajo del objetivo. Revisar calidad de leads y proceso de cierre.',
      });
    }
    if (topCloser) {
      list.push({
        color: 'blue',
        title: `Mejor closer: ${topCloser.closer}`,
        body: `${topCloser.cierres} cierres este mes con ${topCloser.pctCierre}% de tasa de cierre.`,
      });
    }
    return list;
  }, [mes, pctMeta, tasaCierre, totalCierres, mesClosers, topCloser]);

  const aiSummary = useMemo(() => {
    if (!mes.mes) return 'Sin datos disponibles para el período seleccionado.';
    const ventas = ars(mes.ventasTotal || 0);
    const obj    = ars(mes.objetivoPesos || 0);
    const tc     = tasaCierre;
    const roas   = mesAds.roas != null ? dec1(mesAds.roas) : '—';
    const falta  = ars(mes.faltanteObj || 0);
    return `El mes acumula ${ventas} de ${obj} objetivo (${pctMeta.toFixed(0)}%). ${mes.ventasTotales || 0} ventas · ${tc}% de conversión. ROAS de ${roas} en anuncios. Faltan ${falta} para llegar al objetivo.`;
  }, [mes, mesAds, pctMeta, tasaCierre, totalCierres]);

  if (!mes.mes) return <p className="text-sm text-ink-3 py-8 text-center">Sin datos de negocio para este mes</p>;

  const ALERT_STYLES = {
    red:    'border-l-4 border-neg bg-neg-light',
    orange: 'border-l-4 border-gold bg-gold-light',
    blue:   'border-l-4 border-ink-3 bg-cream-light',
  };

  return (
    <div className="space-y-5">
      {/* AI summary */}
      <div className="bg-ink-1 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gold" />
          <span className="text-xs font-semibold tracking-widest uppercase text-white/50">Análisis ejecutivo · IA</span>
        </div>
        <p className="text-sm text-white/90 leading-relaxed">{aiSummary}</p>
      </div>

      {/* Estado del mes */}
      <div>
        <h2 className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Estado del mes</h2>
        <div className="grid grid-cols-2 gap-3">
          <BigCard bg="bg-pos-light">
            <p className="text-xs font-semibold tracking-widest uppercase text-pos/70 mb-1">Ventas del mes</p>
            <p className="text-2xl font-bold text-pos">{ars(mes.ventasTotal)}</p>
            <p className="text-xs text-ink-3 mt-1">{mes.ventasTotales || 0} ventas · de {ars(mes.objetivoPesos)} objetivo</p>
          </BigCard>

          <BigCard bg="bg-neg-light">
            <p className="text-xs font-semibold tracking-widest uppercase text-neg/70 mb-1">Falta para objetivo</p>
            <p className="text-2xl font-bold text-neg">{ars(mes.faltanteObj)}</p>
            <p className="text-xs text-ink-3 mt-1">{mes.faltanteVentas || 0} ventas · faltan</p>
          </BigCard>

          <BigCard bg="bg-white border border-cream">
            <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-1">Cant. ventas</p>
            <p className="text-2xl font-bold text-ink-1">{mes.ventasTotales || '—'}</p>
            <p className="text-xs text-ink-3 mt-1">tasa cierre {tasaCierre}%</p>
          </BigCard>

          <BigCard bg="bg-gold-light">
            <p className="text-xs font-semibold tracking-widest uppercase text-gold-dark/70 mb-1">ROAS anuncios</p>
            <p className="text-2xl font-bold text-gold-dark">{mesAds.roas != null ? dec1(mesAds.roas) : '—'}</p>
            <p className="text-xs text-ink-3 mt-1">inv. {ars(mesAds.inversion)}</p>
          </BigCard>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Alertas</h2>
          <div className="space-y-2">
            {alertas.map((a, i) => (
              <div key={i} className={`rounded-lg p-3 ${ALERT_STYLES[a.color]}`}>
                <p className="text-sm font-semibold text-ink-1">{a.title}</p>
                <p className="text-xs text-ink-2 mt-0.5">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desglose + objetivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-cream shadow-sm p-4 space-y-4">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-ink-3">Objetivos del mes</h2>
          <div>
            <div className="flex justify-between text-xs text-ink-3 mb-1">
              <span>Ventas: {mes.ventasTotales || 0} / {mes.objetivoVentas || 0}</span>
              <span className="font-medium text-ink-2">{mes.objetivoVentas > 0 ? Math.min(100, ((mes.ventasTotales || 0) / mes.objetivoVentas) * 100).toFixed(0) : 0}%</span>
            </div>
            <div className="h-2 bg-cream rounded-full overflow-hidden">
              <div className="h-full bg-pos rounded-full" style={{ width: `${mes.objetivoVentas > 0 ? Math.min(100, ((mes.ventasTotales || 0) / mes.objetivoVentas) * 100) : 0}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-ink-3 mb-1">
              <span>Objetivo $: {ars(mes.ventasTotal)} / {ars(mes.objetivoPesos)}</span>
              <span className="font-medium text-ink-2">{pctMeta.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-cream rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full" style={{ width: `${pctMeta}%` }} />
            </div>
          </div>
          <div className="pt-1">
            <p className="text-xs text-ink-3 font-medium mb-2">Recolección</p>
            {[
              { label: 'Venta nueva',       val: mes.recoleccionVentaNueva      },
              { label: 'Recurrente front',  val: mes.recoleccionRecurrenteFront },
              { label: 'Back',              val: mes.recoleccionBack            },
              { label: 'Recurrente back',   val: mes.recoleccionRecurrenteBack  },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between text-xs py-1 border-b border-cream/50">
                <span className="text-ink-3">{label}</span>
                <span className="font-medium text-ink-2">{ars(val)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-4">Desglose del mes</h2>

          <div className="space-y-2.5 mb-4">
            <div className="rounded-xl bg-pos-light p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-pos mb-1">Ventas nuevas</p>
                <p className="text-2xl font-bold text-pos leading-none">
                  {mes.cantVentasNuevas || 0}
                  <span className="text-sm font-medium ml-1">ventas</span>
                </p>
              </div>
              <p className="text-base font-bold text-pos">{ars(mes.ventasFront)}</p>
            </div>

            <div className="rounded-xl bg-gold-light p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark mb-1">Ventas back</p>
                <p className="text-2xl font-bold text-gold-dark leading-none">
                  {mes.cantVentasBack || 0}
                  <span className="text-sm font-medium ml-1">ventas</span>
                </p>
              </div>
              <p className="text-base font-bold text-gold-dark">{ars(mes.ventasBack)}</p>
            </div>
          </div>

          <div className="border-t border-cream pt-3 space-y-2">
            {[
              { label: 'Cash Collected', val: ars(mes.cashCollected),            cls: 'text-ink-1' },
              { label: 'Costos totales', val: ars(mes.costosTotal),              cls: 'text-neg'   },
              { label: 'Rentabilidad',   val: pct(mes.rentabilidadVentaNueva),   cls: (mes.rentabilidadVentaNueva || 0) >= 0 ? 'text-pos' : 'text-neg' },
              { label: '% CC',           val: pct(mes.pctCC),                    cls: 'text-ink-1' },
            ].map(({ label, val, cls }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <span className="text-sm text-ink-3">{label}</span>
                <span className={`text-sm font-bold ${cls}`}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Closers */}
      {mesClosers.length > 0 && (
        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Resumen closers</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-cream">
                  {['Closer','Agendadas','Asistencias','Ofertas','Cierres','% Cierre','% Asistencia'].map(h => (
                    <th key={h} className="pb-2 px-2 text-left text-xs text-ink-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...mesClosers].sort((a,b) => b.cierres - a.cierres).map((c, i) => (
                  <tr key={c.closer} className="border-b border-cream/50">
                    <td className="py-2.5 px-2 font-medium text-ink-1">{['🥇','🥈','🥉'][i] || ''} {c.closer}</td>
                    <td className="py-2.5 px-2 text-ink-2">{c.agendadas}</td>
                    <td className="py-2.5 px-2 text-ink-2">{c.asistencias}</td>
                    <td className="py-2.5 px-2 text-ink-2">{c.ofertas}</td>
                    <td className="py-2.5 px-2 font-semibold text-ink-1">{c.cierres}</td>
                    <td className="py-2.5 px-2"><span className="text-gold-dark font-semibold">{c.pctCierre}%</span></td>
                    <td className="py-2.5 px-2 text-ink-2">{c.pctAsistencia}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ventas por programa + ARG vs Afuera */}
      <VentasDesglose clientesNuevos={clientesNuevos} recoleccion={recoleccion} selectedMonth={selectedMonth} />

      {/* Cobranzas */}
      <CobranzasSection clientesNuevos={clientesNuevos} recoleccion={recoleccion} />
    </div>
  );
}

// ── Desglose ventas por programa + ARG vs Afuera ──────────────────────────────

const PROGRAMA_COLORS = {
  'M1':      { bg: 'bg-blue-50',   text: 'text-blue-700',   bar: '#3B82F6' },
  'M1+':     { bg: 'bg-indigo-50', text: 'text-indigo-700', bar: '#6366F1' },
  'M1.1':    { bg: 'bg-cyan-50',   text: 'text-cyan-700',   bar: '#06B6D4' },
  'M2':      { bg: 'bg-purple-50', text: 'text-purple-700', bar: '#9333EA' },
  'Back':    { bg: 'bg-amber-50',  text: 'text-amber-700',  bar: '#F59E0B' },
  'Starter': { bg: 'bg-green-50',  text: 'text-green-700',  bar: '#22C55E' },
};

const FUENTE_COLORS = {
  'Automática':   '#6366F1',
  'BIO':          '#3B82F6',
  'ADS':          '#8B5CF6',
  'IG - SETTER':  '#06B6D4',
  'CRM - SETTER': '#0EA5E9',
  'REPESCA':      '#F97316',
  'YOUTUBE':      '#EF4444',
  'BACK':         '#F59E0B',
  'EMAIL':        '#9CA3AF',
};

function MiniBar({ value, max, color = '#0284C7' }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex-1 h-1.5 bg-cream rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${w}%`, backgroundColor: color }} />
    </div>
  );
}

const MES_LABELS_SHORT = {
  '2025-01':'Ene 25','2025-02':'Feb 25','2025-03':'Mar 25','2025-04':'Abr 25','2025-05':'May 25','2025-06':'Jun 25',
  '2025-07':'Jul 25','2025-08':'Ago 25','2025-09':'Sep 25','2025-10':'Oct 25','2025-11':'Nov 25','2025-12':'Dic 25',
  '2026-01':'Enero','2026-02':'Febrero','2026-03':'Marzo','2026-04':'Abril','2026-05':'Mayo','2026-06':'Junio',
  '2026-07':'Julio','2026-08':'Agosto','2026-09':'Septiembre','2026-10':'Octubre','2026-11':'Noviembre','2026-12':'Diciembre',
};

function VentasDesglose({ clientesNuevos = [], recoleccion = [], selectedMonth }) {
  const mesClientes = useMemo(
    () => clientesNuevos.filter(c => c.ingreso === selectedMonth),
    [clientesNuevos, selectedMonth]
  );

  // ── ARG/USA por mes (all months, both datasets) ──
  const porMes = useMemo(() => {
    const map = {};
    function agregar(dataset) {
      dataset.forEach(c => {
        (c.pagos || []).forEach(p => {
          if (!p || p.estado !== 'Cobrado' || !p.fechaISO) return;
          const key = p.fechaISO.slice(0, 7);
          if (!map[key]) map[key] = { mes: key, argentina: 0, usa: 0, efectivo: 0 };
          if (p.clasificacion === 'argentina') map[key].argentina += p.monto || 0;
          else if (p.clasificacion === 'usa')  map[key].usa       += p.monto || 0;
          else if (p.clasificacion === 'efectivo') map[key].efectivo += p.monto || 0;
        });
      });
    }
    agregar(clientesNuevos);
    agregar(recoleccion);
    return Object.values(map)
      .map(r => ({ ...r, total: r.argentina + r.usa + r.efectivo }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }, [clientesNuevos, recoleccion]);

  const totalesGeneral = useMemo(() => porMes.reduce(
    (acc, r) => ({ argentina: acc.argentina + r.argentina, usa: acc.usa + r.usa, efectivo: acc.efectivo + r.efectivo, total: acc.total + r.total }),
    { argentina: 0, usa: 0, efectivo: 0, total: 0 }
  ), [porMes]);

  // ── Por programa (mes seleccionado) ──
  const porPrograma = useMemo(() => {
    const map = {};
    mesClientes.forEach(c => {
      const p = c.programa || 'Sin programa';
      if (!map[p]) map[p] = { programa: p, cantidad: 0, ventas: 0, cobrado: 0 };
      map[p].cantidad++;
      map[p].ventas  += c.montoTotal  || 0;
      map[p].cobrado += c.montoPagado || 0;
    });
    return Object.values(map).sort((a, b) => b.ventas - a.ventas);
  }, [mesClientes]);

  const maxVentas = Math.max(...porPrograma.map(p => p.ventas), 1);

  // ── Por fuente (mes seleccionado) ──
  const porFuente = useMemo(() => {
    const map = {};
    mesClientes.forEach(c => {
      const f = c.fuente || 'Sin fuente';
      if (!map[f]) map[f] = { fuente: f, cantidad: 0, ventas: 0 };
      map[f].cantidad++;
      map[f].ventas += c.montoTotal || 0;
    });
    return Object.values(map).sort((a, b) => b.cantidad - a.cantidad);
  }, [mesClientes]);

  const maxFuente = Math.max(...porFuente.map(f => f.cantidad), 1);

  if (porMes.length === 0 && mesClientes.length === 0) return null;

  const pctArg = totalesGeneral.total > 0 ? Math.round((totalesGeneral.argentina / totalesGeneral.total) * 100) : 0;
  const pctUSA = totalesGeneral.total > 0 ? Math.round((totalesGeneral.usa       / totalesGeneral.total) * 100) : 0;
  const pctEfe = totalesGeneral.total > 0 ? Math.round((totalesGeneral.efectivo  / totalesGeneral.total) * 100) : 0;

  const thCls = 'pb-2 px-3 text-left text-xs text-ink-3 font-medium whitespace-nowrap';
  const tdCls = 'py-2 px-3 text-sm text-ink-2';

  return (
    <div className="space-y-4">

      {/* ARG vs AFUERA — tabla mensual + visual acumulado */}
      <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-cream flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-ink-3">
            Argentina vs Afuera — cobrado por mes
          </h2>
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-ink-3">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Argentina</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />Afuera/USA</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />Efectivo</span>
          </div>
        </div>

        {/* Stacked bar acumulado */}
        {totalesGeneral.total > 0 && (
          <div className="px-4 py-3 border-b border-cream">
            <div className="flex h-8 rounded-lg overflow-hidden gap-0.5 mb-2">
              {totalesGeneral.argentina > 0 && (
                <div className="bg-blue-500 flex items-center justify-center" style={{ width: `${pctArg}%` }}>
                  {pctArg > 8 && <span className="text-white text-xs font-bold">{pctArg}%</span>}
                </div>
              )}
              {totalesGeneral.usa > 0 && (
                <div className="bg-indigo-500 flex items-center justify-center" style={{ width: `${pctUSA}%` }}>
                  {pctUSA > 8 && <span className="text-white text-xs font-bold">{pctUSA}%</span>}
                </div>
              )}
              {totalesGeneral.efectivo > 0 && (
                <div className="bg-gray-400 flex items-center justify-center" style={{ width: `${pctEfe}%` }}>
                  {pctEfe > 8 && <span className="text-white text-xs font-bold">{pctEfe}%</span>}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><p className="text-sm font-bold text-blue-600">{usd(totalesGeneral.argentina)}</p><p className="text-xs text-ink-3">ARG ({pctArg}%)</p></div>
              <div><p className="text-sm font-bold text-indigo-600">{usd(totalesGeneral.usa)}</p><p className="text-xs text-ink-3">USA ({pctUSA}%)</p></div>
              <div><p className="text-sm font-bold text-gray-500">{usd(totalesGeneral.efectivo)}</p><p className="text-xs text-ink-3">Efectivo ({pctEfe}%)</p></div>
              <div><p className="text-sm font-bold text-ink-1">{usd(totalesGeneral.total)}</p><p className="text-xs text-ink-3">Total cobrado</p></div>
            </div>
          </div>
        )}

        {/* Monthly table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-cream bg-page">
                <th className={thCls}>Mes</th>
                <th className={`${thCls} text-blue-600`}>Argentina</th>
                <th className={`${thCls} text-indigo-600`}>Afuera / USA</th>
                <th className={`${thCls} text-gray-500`}>Efectivo</th>
                <th className={`${thCls} text-ink-1`}>Total</th>
                <th className={thCls}>%ARG</th>
                <th className={thCls}>%USA</th>
              </tr>
            </thead>
            <tbody>
              {porMes.map(r => {
                const pA = r.total > 0 ? Math.round((r.argentina / r.total) * 100) : 0;
                const pU = r.total > 0 ? Math.round((r.usa       / r.total) * 100) : 0;
                const isSelected = r.mes === selectedMonth;
                return (
                  <tr key={r.mes} className={`border-b border-cream/50 ${isSelected ? 'bg-gold-light/30' : 'hover:bg-page'} transition-colors`}>
                    <td className="py-2.5 px-3 font-medium text-ink-1 whitespace-nowrap">
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block mr-1.5 mb-0.5" />}
                      {MES_LABELS_SHORT[r.mes] || r.mes}
                    </td>
                    <td className="py-2.5 px-3 text-blue-600 font-medium">{r.argentina > 0 ? usd(r.argentina) : <span className="text-ink-3">—</span>}</td>
                    <td className="py-2.5 px-3 text-indigo-600 font-medium">{r.usa > 0 ? usd(r.usa) : <span className="text-ink-3">—</span>}</td>
                    <td className="py-2.5 px-3 text-gray-500">{r.efectivo > 0 ? usd(r.efectivo) : <span className="text-ink-3">—</span>}</td>
                    <td className="py-2.5 px-3 font-bold text-ink-1">{usd(r.total)}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-cream rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pA}%` }} />
                        </div>
                        <span className="text-xs text-ink-2">{pA}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-cream rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pU}%` }} />
                        </div>
                        <span className="text-xs text-ink-2">{pU}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {porMes.length > 1 && (
              <tfoot>
                <tr className="border-t-2 border-cream bg-page font-semibold">
                  <td className="py-2.5 px-3 text-ink-1 text-xs uppercase tracking-wide">Total</td>
                  <td className="py-2.5 px-3 text-blue-600">{usd(totalesGeneral.argentina)}</td>
                  <td className="py-2.5 px-3 text-indigo-600">{usd(totalesGeneral.usa)}</td>
                  <td className="py-2.5 px-3 text-gray-500">{usd(totalesGeneral.efectivo)}</td>
                  <td className="py-2.5 px-3 text-ink-1">{usd(totalesGeneral.total)}</td>
                  <td className="py-2.5 px-3 text-ink-2">{pctArg}%</td>
                  <td className="py-2.5 px-3 text-ink-2">{pctUSA}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Por programa + Por fuente — ambas con tabla */}
      {(porPrograma.length > 0 || porFuente.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Por programa */}
          {porPrograma.length > 0 && (
            <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-cream">
                <h2 className="text-xs font-semibold tracking-widest uppercase text-ink-3">
                  Por programa · {mesClientes.length} clientes
                </h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream bg-page">
                    <th className={thCls}>Programa</th>
                    <th className={`${thCls} text-right`}>Clientes</th>
                    <th className={`${thCls} text-right`}>Ventas</th>
                    <th className={`${thCls} text-right`}>Cobrado</th>
                    <th className={thCls}></th>
                  </tr>
                </thead>
                <tbody>
                  {porPrograma.map(p => {
                    const style = PROGRAMA_COLORS[p.programa] || { bg: 'bg-gray-50', text: 'text-gray-700', bar: '#9CA3AF' };
                    return (
                      <tr key={p.programa} className="border-b border-cream/50 hover:bg-page transition-colors">
                        <td className="py-2.5 px-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${style.bg} ${style.text}`}>{p.programa}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-ink-1">{p.cantidad}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-ink-1">{usd(p.ventas)}</td>
                        <td className="py-2.5 px-3 text-right text-pos font-medium">{usd(p.cobrado)}</td>
                        <td className="py-2.5 px-3 w-20">
                          <MiniBar value={p.ventas} max={maxVentas} color={style.bar} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {porPrograma.length > 1 && (
                  <tfoot>
                    <tr className="border-t-2 border-cream bg-page font-semibold">
                      <td className="py-2 px-3 text-xs text-ink-3 uppercase tracking-wide">Total</td>
                      <td className="py-2 px-3 text-center text-ink-1">{porPrograma.reduce((s, p) => s + p.cantidad, 0)}</td>
                      <td className="py-2 px-3 text-right text-ink-1">{usd(porPrograma.reduce((s, p) => s + p.ventas, 0))}</td>
                      <td className="py-2 px-3 text-right text-pos">{usd(porPrograma.reduce((s, p) => s + p.cobrado, 0))}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* Por fuente */}
          {porFuente.length > 0 && (
            <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-cream">
                <h2 className="text-xs font-semibold tracking-widest uppercase text-ink-3">
                  Por fuente de origen
                </h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream bg-page">
                    <th className={thCls}>Fuente</th>
                    <th className={`${thCls} text-right`}>Clientes</th>
                    <th className={`${thCls} text-right`}>Ventas</th>
                    <th className={thCls}></th>
                  </tr>
                </thead>
                <tbody>
                  {porFuente.map(f => {
                    const color = FUENTE_COLORS[f.fuente] || '#9CA3AF';
                    return (
                      <tr key={f.fuente} className="border-b border-cream/50 hover:bg-page transition-colors">
                        <td className="py-2.5 px-3 text-ink-2">{f.fuente}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-ink-1">{f.cantidad}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-ink-1">{usd(f.ventas)}</td>
                        <td className="py-2.5 px-3 w-20">
                          <MiniBar value={f.cantidad} max={maxFuente} color={color} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {porFuente.length > 1 && (
                  <tfoot>
                    <tr className="border-t-2 border-cream bg-page font-semibold">
                      <td className="py-2 px-3 text-xs text-ink-3 uppercase tracking-wide">Total</td>
                      <td className="py-2 px-3 text-center text-ink-1">{porFuente.reduce((s, f) => s + f.cantidad, 0)}</td>
                      <td className="py-2 px-3 text-right text-ink-1">{usd(porFuente.reduce((s, f) => s + f.ventas, 0))}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
