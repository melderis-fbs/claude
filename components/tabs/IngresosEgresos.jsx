'use client';
import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatCard from '../ui/StatCard.jsx';
import { TrendingDown, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

function ars(n) { return `$ ${Number(n || 0).toLocaleString('es-AR')}`; }

function isPastDue(fechaStr) {
  if (!fechaStr) return false;
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    // Past due only if the cuota's month is before the current month
    return d.getFullYear() * 12 + d.getMonth() < now.getFullYear() * 12 + now.getMonth();
  } catch { return false; }
}

const CAT_COLORS = {
  sueldos: '#3B82F6', publicidad: '#8B5CF6', apps: '#10B981',
  gastosAdmin: '#6B7280', formacion: '#F59E0B', impuestos: '#EF4444', extras: '#D1D5DB',
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

function normDateToMonth(s) {
  if (!s) return null;
  const str = String(s).trim();
  if (/^\d{4}-\d{2}/.test(str)) return str.slice(0, 7);
  const dmy = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}`;
  const my = str.match(/^(\d{2})\/(\d{4})$/);
  if (my) return `${my[2]}-${my[1]}`;
  try { const d = new Date(str); if (!isNaN(d)) return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; } catch {}
  return null;
}

function ClienteCard({ cliente, isNew }) {
  const [open, setOpen] = useState(false);
  const tieneVencido = cliente.cuotas.some(c => c.estado === 'Vencido');
  const tienePendiente = cliente.cuotas.some(c => c.estado === 'Pendiente');

  return (
    <div className={clsx(
      'rounded-xl border overflow-hidden',
      tieneVencido ? 'border-neg/30' : 'border-cream'
    )}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-page transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', tieneVencido ? 'bg-neg' : tienePendiente ? 'bg-gold' : 'bg-pos')} />
          <span className="text-sm font-semibold text-ink-1">{cliente.nombre}</span>
          {isNew && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-pos-light text-pos font-semibold">Nuevo</span>
          )}
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

  const latestEgresos = useMemo(
    () => [...egresos].sort((a, b) => b.mes.localeCompare(a.mes))[0] || {},
    [egresos]
  );

  const mesEgresos = useMemo(
    () => egresos.find(r => r.mes === selectedMonth) || latestEgresos,
    [egresos, selectedMonth, latestEgresos]
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
      if (!map[c.nombre]) map[c.nombre] = {
        nombre: c.nombre, cuotas: [],
        totalCobrado: 0, totalPendiente: 0, totalVencido: 0,
        fechaPrimerPago: c.fechaPrimerPago || null,
      };
      // Keep earliest fechaPrimerPago
      if (c.fechaPrimerPago && (!map[c.nombre].fechaPrimerPago || c.fechaPrimerPago < map[c.nombre].fechaPrimerPago)) {
        map[c.nombre].fechaPrimerPago = c.fechaPrimerPago;
      }
      map[c.nombre].cuotas.push(c);
      if (c.estado === 'Cobrado')   map[c.nombre].totalCobrado   += c.montoCuota;
      if (c.estado === 'Pendiente') map[c.nombre].totalPendiente += c.montoCuota;
      if (c.estado === 'Vencido')   map[c.nombre].totalVencido   += c.montoCuota;
    });
    return Object.values(map).sort((a, b) => {
      const aNew = normDateToMonth(a.fechaPrimerPago) === selectedMonth ? 1 : 0;
      const bNew = normDateToMonth(b.fechaPrimerPago) === selectedMonth ? 1 : 0;
      if (bNew !== aNew) return bNew - aNew;
      if (a.totalVencido !== b.totalVencido) return b.totalVencido - a.totalVencido;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [cobranzas, selectedMonth]);

  const deudores = useMemo(() =>
    clientes.filter(c => c.totalVencido > 0),
    [clientes]
  );

  const cobStats = useMemo(() => {
    const monthly = cobranzas.filter(c => normDateToMonth(c.fechaCuota) === selectedMonth);
    return {
      cobrado:   monthly.filter(c => c.estado === 'Cobrado').reduce((s, c) => s + c.montoCuota, 0),
      pendiente: monthly.filter(c => c.estado === 'Pendiente').reduce((s, c) => s + c.montoCuota, 0),
      vencido:   monthly.filter(c => c.estado === 'Vencido').reduce((s, c) => s + c.montoCuota, 0),
    };
  }, [cobranzas, selectedMonth]);

  const pendientesMes = useMemo(() =>
    clientes
      .map(c => ({
        ...c,
        cuotasMes: c.cuotas.filter(q => q.estado === 'Pendiente' && normDateToMonth(q.fechaCuota) === selectedMonth),
      }))
      .filter(c => c.cuotasMes.length > 0),
    [clientes, selectedMonth]
  );

  const meta       = mesEgresos.metaCobranza || 0;
  const cobradoMes = mesEgresos.cobradoReal  || 0;
  const pctMeta    = meta > 0 ? Math.min(100, (cobradoMes / meta) * 100) : 0;

  return (
    <div className="space-y-5">

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
            {clientes.map(c => (
              <ClienteCard
                key={c.nombre}
                cliente={c}
                isNew={normDateToMonth(c.fechaPrimerPago) === selectedMonth}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Por cobrar este mes ── */}
      {pendientesMes.length > 0 && (
        <div className="bg-white rounded-xl border border-gold/30 shadow-sm p-4">
          <h3 className="text-xs font-semibold tracking-widest uppercase text-gold-dark mb-3">
            Por cobrar este mes · {pendientesMes.length} clientes
          </h3>
          <div className="divide-y divide-cream">
            {pendientesMes.map(c => {
              const total = c.cuotasMes.reduce((s, q) => s + q.montoCuota, 0);
              return (
                <div key={c.nombre} className="flex items-center justify-between py-2.5">
                  <div>
                    <span className="text-sm font-semibold text-ink-1">{c.nombre}</span>
                    <span className="ml-2 text-xs text-ink-3">{c.cuotasMes.length} cuota{c.cuotasMes.length !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-sm font-bold text-gold-dark">{ars(total)}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-cream mt-2 pt-2 flex justify-between">
            <span className="text-xs font-semibold text-ink-3">Total pendiente</span>
            <span className="text-sm font-bold text-gold-dark">
              {ars(pendientesMes.reduce((s, c) => s + c.cuotasMes.reduce((ss, q) => ss + q.montoCuota, 0), 0))}
            </span>
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
              const pastDuePending = d.cuotas
                .filter(q => q.estado === 'Pendiente' && isPastDue(q.fechaCuota))
                .reduce((s, q) => s + (q.montoCuota || 0), 0);
              const adeudado = d.totalVencido + pastDuePending;
              const comentario = comentarios.find(c => c.nombre === d.nombre);
              return (
                <div key={d.nombre} className="bg-neg-light rounded-xl p-3 border border-neg/20">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-semibold text-ink-1">{d.nombre}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-neg">{ars(adeudado)}</p>
                      <p className="text-xs text-ink-3">adeudado</p>
                    </div>
                  </div>
                  {d.totalVencido > 0 && pastDuePending > 0 && (
                    <p className="text-xs text-ink-3 mb-1">{ars(d.totalVencido)} vencido · {ars(pastDuePending)} pendiente atrasado</p>
                  )}
                  {d.totalVencido > 0 && pastDuePending === 0 && (
                    <p className="text-xs text-ink-3 mb-1">cuotas vencidas sin cobrar</p>
                  )}
                  {d.totalVencido === 0 && pastDuePending > 0 && (
                    <p className="text-xs text-ink-3 mb-1">cuotas de meses anteriores sin cobrar</p>
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
