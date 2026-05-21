'use client';
import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

function ars(n) { return `$ ${Number(n || 0).toLocaleString('es-AR')}`; }
// Detecta automáticamente si el valor es fracción (0-1) o ya es porcentaje (>1)
function pct(n) {
  const v = Number(n || 0);
  const p = (v > 0 && v <= 1) ? v * 100 : v;
  return `${p.toFixed(1)}%`;
}
function dec1(n) { return Number(n || 0).toFixed(1); }

const TooltipARS = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-cream rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-ink-2 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {ars(p.value)}</p>
      ))}
    </div>
  );
};

function BigCard({ bg, children }) {
  return (
    <div className={`rounded-xl p-4 ${bg}`}>
      {children}
    </div>
  );
}

export default function Overview({ negocio = [], anuncios = [], closers = [], selectedMonth }) {
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

  const chartData = useMemo(
    () => [...negocio].sort((a, b) => a.mes.localeCompare(b.mes)).slice(-4).map(r => ({
      mes:    r.mesLabel?.split(' ')[0] || r.mes,
      Ventas: r.ventasTotal,
      Cash:   r.cashCollected,
      Costos: r.costosTotal,
    })),
    [negocio]
  );

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
    return `El mes acumula ${ventas} de ${obj} objetivo (${pctMeta.toFixed(0)}%). ${totalCierres} cierres con ${tc}% de conversión. ROAS de ${roas} en anuncios. Faltan ${falta} para llegar al objetivo.`;
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
            <p className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-1">Cierres del mes</p>
            <p className="text-2xl font-bold text-ink-1">{totalCierres || '—'}</p>
            <p className="text-xs text-ink-3 mt-1">tasa {tasaCierre}%</p>
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
          <h2 className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Desglose del mes</h2>
          <div className="space-y-2 mb-4">
            {[
              { label: 'Ventas nuevas', count: mes.cantVentasNuevas, monto: mes.ventasFront },
              { label: 'Ventas back',   count: mes.cantVentasBack,   monto: mes.ventasBack  },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between p-2 rounded-lg bg-page">
                <span className="text-sm text-ink-2">{row.label}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-ink-1 mr-3">{row.count || 0} ventas</span>
                  <span className="text-sm font-bold text-gold-dark">{ars(row.monto)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Rentabilidad',  val: pct(mes.rentabilidadVentaNueva), ok: (mes.rentabilidadVentaNueva || 0) >= 0 },
              { label: '% CC',          val: pct(mes.pctCC),                  ok: true },
              { label: 'Cash Collected',val: ars(mes.cashCollected),           ok: true },
              { label: 'Costos totales',val: ars(mes.costosTotal),             ok: false },
            ].map(({ label, val, ok }) => (
              <div key={label} className="rounded-lg p-3 bg-page">
                <p className="text-xs text-ink-3">{label}</p>
                <p className={`text-sm font-bold ${ok ? 'text-ink-1' : 'text-neg'}`}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tendencia */}
      <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-4">Tendencia mensual</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={18} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#999999' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#999999' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${Math.round(v/1000)}K` : `$${v}`} />
            <Tooltip content={<TooltipARS />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Ventas" fill="#3B82F6" radius={[4,4,0,0]} />
            <Bar dataKey="Cash"   fill="#10B981" radius={[4,4,0,0]} />
            <Bar dataKey="Costos" fill="#EF4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
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
    </div>
  );
}
