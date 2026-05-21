'use client';
import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MonthSelector from '../ui/MonthSelector.jsx';
import StatCard from '../ui/StatCard.jsx';
import { TrendingDown, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

function ars(n) { return `$ ${Number(n || 0).toLocaleString('es-AR')}`; }

const CAT_COLORS = {
  sueldos: '#B8960C', publicidad: '#C4B49A', apps: '#8B6E09',
  gastosAdmin: '#A8A29E', formacion: '#6B6560', impuestos: '#7A4A42', extras: '#E8E2D9',
};
const CAT_LABELS = {
  sueldos: 'Sueldos', publicidad: 'Publicidad', apps: 'APPS',
  gastosAdmin: 'Gastos admin.', formacion: 'Formación', impuestos: 'Impuestos', extras: 'Extras',
};

const EgresosTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-cream rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-ink-2">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }}>{ars(payload[0].value)}</p>
    </div>
  );
};

const ESTADO = {
  Cobrado:  { dot: 'bg-pos',      text: 'text-pos',       badge: 'bg-pos-light text-pos',       icon: CheckCircle },
  Pendiente:{ dot: 'bg-gold',     text: 'text-gold-dark', badge: 'bg-gold-light text-gold-dark', icon: Clock       },
  Vencido:  { dot: 'bg-neg',      text: 'text-neg',       badge: 'bg-neg-light text-neg',        icon: AlertCircle },
};

function EstadoBadge({ estado }) {
  const s = ESTADO[estado] || { badge: 'bg-cream text-ink-2', icon: Clock };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.badge}`}>
      <Icon size={10} />{estado}
    </span>
  );
}

function ClienteCard({ cliente }) {
  const [open, setOpen] = useState(false);
  const tieneVencido = cliente.cuotas.some(c => c.estado === 'Vencido');
  const tienePendiente = cliente.cuotas.some(c => c.estado === 'Pendiente');

  return (
    <div className={clsx(
      'rounded-xl border overflow-hidden',
      tieneVencido ? 'border-neg/30' : tienePendiente ? 'border-cream' : 'border-cream'
    )}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-page transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', tieneVencido ? 'bg-neg' : tienePendiente ? 'bg-gold' : 'bg-pos')} />
          <span className="text-sm font-semibold text-ink-1">{cliente.nombre}</span>
          <span className="text-xs text-ink-3">{cliente.cuotas.length} cuota{cliente.cuotas.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-ink-1">{ars(cliente.totalPendiente + cliente.totalVencido > 0 ? cliente.totalVencido + cliente.totalPendiente : cliente.totalCobrado)}</span>
          {open ? <ChevronUp size={14} className="text-ink-3" /> : <ChevronDown size={14} className="text-ink-3" />}
        </div>
      </button>

      {open && (
        <div className="divide-y divide-cream bg-page">
          {cliente.cuotas.map((c, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-3">Cuota {c.nCuota}/{c.cantCuotas}</span>
                <span className="text-xs text-ink-3">{c.fechaCuota}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-ink-1">{ars(c.montoCuota)}</span>
                <EstadoBadge estado={c.estado} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IngresosEgresos({ data = {}, months = [], selectedMonth, onMonthChange }) {
  const { egresos = [], cobranzas = [], comentarios = [] } = data;

  const mesEgresos = useMemo(
    () => egresos.find(r => r.mes === selectedMonth) || egresos[0] || {},
    [egresos, selectedMonth]
  );

  const pieData = useMemo(() =>
    Object.keys(CAT_COLORS)
      .filter(k => mesEgresos[k] > 0)
      .map(k => ({ name: CAT_LABELS[k], value: mesEgresos[k], fill: CAT_COLORS[k] })),
    [mesEgresos]
  );

  // Agrupar cobranzas por cliente
  const clientes = useMemo(() => {
    const map = {};
    cobranzas.forEach(c => {
      if (!map[c.nombre]) map[c.nombre] = { nombre: c.nombre, cuotas: [], totalCobrado: 0, totalPendiente: 0, totalVencido: 0 };
      map[c.nombre].cuotas.push(c);
      if (c.estado === 'Cobrado')   map[c.nombre].totalCobrado   += c.montoCuota;
      if (c.estado === 'Pendiente') map[c.nombre].totalPendiente += c.montoCuota;
      if (c.estado === 'Vencido')   map[c.nombre].totalVencido   += c.montoCuota;
    });
    return Object.values(map).sort((a, b) => {
      if (a.totalVencido !== b.totalVencido) return b.totalVencido - a.totalVencido;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [cobranzas]);

  const deudores = useMemo(() =>
    clientes.filter(c => c.totalVencido > 0),
    [clientes]
  );

  const cobStats = useMemo(() => ({
    cobrado:   cobranzas.filter(c => c.estado === 'Cobrado').reduce((s, c) => s + c.montoCuota, 0),
    pendiente: cobranzas.filter(c => c.estado === 'Pendiente').reduce((s, c) => s + c.montoCuota, 0),
    vencido:   cobranzas.filter(c => c.estado === 'Vencido').reduce((s, c) => s + c.montoCuota, 0),
  }), [cobranzas]);

  const meta       = mesEgresos.metaCobranza || 0;
  const cobradoMes = mesEgresos.cobradoReal  || 0;
  const pctMeta    = meta > 0 ? Math.min(100, (cobradoMes / meta) * 100) : 0;

  return (
    <div className="space-y-5">
      <MonthSelector months={months} selected={selectedMonth} onChange={onMonthChange} />

      {/* ── Egresos ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={TrendingDown} label="Total egresos" value={ars(mesEgresos.total)}     accent="red"    />
        <StatCard icon={TrendingDown} label="Sueldos"       value={ars(mesEgresos.sueldos)}   accent="teal"   />
        <StatCard icon={TrendingDown} label="Publicidad"    value={ars(mesEgresos.publicidad)} accent="blue"  />
        <StatCard icon={TrendingDown} label="Impuestos"     value={ars(mesEgresos.impuestos)}  accent="orange"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {pieData.length > 0 && (
          <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Egresos por categoría</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip content={<EgresosTooltip />} />
                <Legend formatter={v => <span className="text-xs text-ink-2">{v}</span>} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <h3 className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">Detalle egresos</h3>
          <div className="space-y-1.5">
            {Object.keys(CAT_LABELS).map(k => (
              <div key={k} className="flex items-center justify-between py-1.5 border-b border-cream/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CAT_COLORS[k] }} />
                  <span className="text-sm text-ink-2">{CAT_LABELS[k]}</span>
                </div>
                <span className="text-sm font-semibold text-ink-1">{ars(mesEgresos[k] || 0)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <span className="text-sm font-bold text-neg">Total</span>
              <span className="text-sm font-bold text-neg">{ars(mesEgresos.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cobranzas: meta del mes ── */}
      <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
        <h3 className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-4">Cobranzas · {mesEgresos.mesLabel || selectedMonth}</h3>

        {meta > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-ink-3 mb-1.5">
              <span>Meta del mes</span>
              <span className="font-semibold text-ink-1">{ars(cobradoMes)} / {ars(meta)}</span>
            </div>
            <div className="h-2.5 bg-cream rounded-full overflow-hidden">
              <div className="h-full bg-pos rounded-full transition-all" style={{ width: `${pctMeta}%` }} />
            </div>
            <p className="text-xs text-ink-3 mt-1 text-right">{pctMeta.toFixed(0)}% cobrado</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Cobrado',   val: cobStats.cobrado,   key: 'Cobrado'   },
            { label: 'Pendiente', val: cobStats.pendiente, key: 'Pendiente' },
            { label: 'Vencido',   val: cobStats.vencido,   key: 'Vencido'   },
          ].map(({ label, val, key }) => {
            const s = ESTADO[key]; const Icon = s.icon;
            return (
              <div key={key} className={`${s.badge.split(' ')[0].replace('text', 'bg').replace('-light','').replace('bg-pos','bg-pos-light').replace('bg-gold','bg-gold-light').replace('bg-neg','bg-neg-light')} rounded-xl p-3 text-center`}>
                <Icon size={15} className={`${s.text} mx-auto mb-1`} />
                <p className="text-xs text-ink-3">{label}</p>
                <p className={`text-sm font-bold ${s.text}`}>{ars(val)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Clientes y sus cuotas ── */}
      {clientes.length > 0 && (
        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <h3 className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-3">
            Clientes · {clientes.length} activos
          </h3>
          <div className="space-y-2">
            {clientes.map(c => <ClienteCard key={c.nombre} cliente={c} />)}
          </div>
        </div>
      )}

      {/* ── Deudores ── */}
      {deudores.length > 0 && (
        <div className="bg-white rounded-xl border border-neg/20 shadow-sm p-4">
          <h3 className="text-xs font-semibold tracking-widest uppercase text-neg mb-3">
            Deudores · {deudores.length} con cuotas vencidas
          </h3>
          <div className="space-y-3">
            {deudores.map(d => {
              const comentario = comentarios.find(c => c.nombre === d.nombre);
              return (
                <div key={d.nombre} className="bg-neg-light rounded-xl p-3 border border-neg/20">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-semibold text-ink-1">{d.nombre}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-neg">{ars(d.totalVencido)}</p>
                      <p className="text-xs text-ink-3">vencido</p>
                    </div>
                  </div>
                  {d.totalPendiente > 0 && (
                    <p className="text-xs text-ink-3 mb-1">+ {ars(d.totalPendiente)} pendiente</p>
                  )}
                  {comentario && (
                    <p className="text-xs text-ink-2 mt-2 pt-2 border-t border-neg/20">
                      {comentario.fecha && <span className="text-ink-3 mr-1">{comentario.fecha} —</span>}
                      {comentario.comentario}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-ink-3 pb-2">
        Última actualización: {new Date().toLocaleString('es-AR')}
      </p>
    </div>
  );
}
