'use client';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import clsx from 'clsx';
import { useComentarios } from '../ui/useComentarios.js';

function usd(n) { return '$ ' + Number(n || 0).toLocaleString('es-AR'); }

const MES_LABELS = {
  '2025-01': 'Ene 2025', '2025-02': 'Feb 2025', '2025-03': 'Mar 2025',
  '2025-04': 'Abr 2025', '2025-05': 'May 2025', '2025-06': 'Jun 2025',
  '2025-07': 'Jul 2025', '2025-08': 'Ago 2025', '2025-09': 'Sep 2025',
  '2025-10': 'Oct 2025', '2025-11': 'Nov 2025', '2025-12': 'Dic 2025',
  '2026-01': 'Enero',    '2026-02': 'Febrero',   '2026-03': 'Marzo',
  '2026-04': 'Abril',    '2026-05': 'Mayo',       '2026-06': 'Junio',
  '2026-07': 'Julio',    '2026-08': 'Agosto',     '2026-09': 'Septiembre',
  '2026-10': 'Octubre',  '2026-11': 'Noviembre',  '2026-12': 'Diciembre',
};

function mesLabel(key) { return MES_LABELS[key] || key || '—'; }

function FuenteBadge({ fuente }) {
  const styles = {
    'BIO':         'bg-blue-50 text-blue-700',
    'ADS':         'bg-purple-50 text-purple-700',
    'Automática':  'bg-green-50 text-green-700',
    'IG - SETTER': 'bg-indigo-50 text-indigo-700',
    'CRM - SETTER':'bg-cyan-50 text-cyan-700',
    'REPESCA':     'bg-orange-50 text-orange-700',
    'YOUTUBE':     'bg-red-50 text-red-700',
    'BACK':        'bg-amber-50 text-amber-700',
  };
  const cls = styles[fuente] || 'bg-gray-50 text-gray-600';
  return (
    <span className={clsx('inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold', cls)}>
      {fuente || '—'}
    </span>
  );
}

function ProgramaBadge({ programa }) {
  const styles = {
    'M1':      'bg-blue-100 text-blue-800',
    'M1+':     'bg-indigo-100 text-indigo-800',
    'M1.1':    'bg-cyan-100 text-cyan-800',
    'M2':      'bg-purple-100 text-purple-800',
    'Back':    'bg-amber-100 text-amber-800',
    'Starter': 'bg-green-100 text-green-800',
  };
  const cls = styles[programa] || 'bg-gray-100 text-gray-700';
  return (
    <span className={clsx('inline-block px-2 py-0.5 rounded text-xs font-semibold', cls)}>
      {programa || '—'}
    </span>
  );
}

function EstadoBadge({ estado }) {
  const map = {
    'Cobrado':   'bg-pos-light text-pos',
    'Vencido':   'bg-neg-light text-neg',
    'Pendiente': 'bg-gold-light text-gold-dark',
  };
  const cls = map[estado] || 'bg-cream text-ink-3';
  return (
    <span className={clsx('inline-block px-2 py-0.5 rounded text-xs font-semibold', cls)}>
      {estado}
    </span>
  );
}

function PagoDot({ estado }) {
  if (!estado) return <span className="w-3 h-3 rounded-full bg-cream inline-block" title="Sin cuota" />;
  const map = {
    'Cobrado':   'bg-pos',
    'Pendiente': 'bg-gold',
    'Vencido':   'bg-neg',
  };
  return <span className={clsx('w-3 h-3 rounded-full inline-block', map[estado] || 'bg-cream')} title={estado} />;
}

function CheckIcon({ val }) {
  return val
    ? <span className="text-pos font-bold text-sm">✓</span>
    : <span className="text-ink-3 text-sm">—</span>;
}

function ComentarioCell({ nombre, getComentario, saveComentario, saving }) {
  const key = 'cliente|' + nombre;
  const [text, setText] = useState(() => getComentario('cliente', nombre));
  const timerRef = useRef(null);

  useEffect(() => {
    setText(getComentario('cliente', nombre));
  }, [nombre, getComentario]);

  function handleChange(e) {
    const val = e.target.value;
    setText(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveComentario('cliente', nombre, val);
    }, 800);
  }

  const isSaving = saving[key];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-ink-3">Comentario</p>
        {isSaving
          ? <span className="text-[10px] text-ink-3">Guardando...</span>
          : text.trim()
            ? <span className="text-[10px] text-pos">Guardado ✓</span>
            : null
        }
      </div>
      <textarea
        value={text}
        onChange={handleChange}
        onClick={e => e.stopPropagation()}
        placeholder="Comentario compartido sobre este cliente..."
        rows={2}
        className="w-full text-xs border border-cream rounded-lg p-2 resize-none text-ink-2 focus:outline-none focus:border-gold-dark bg-page"
      />
    </div>
  );
}

function ExpandedRow({ cliente, getComentario, saveComentario, saving }) {
  return (
    <div className="p-4 bg-page border-t border-cream space-y-4" onClick={e => e.stopPropagation()}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-ink-3 mb-0.5">Email</p>
          <p className="text-ink-2 font-medium">{cliente.email || '—'}</p>
        </div>
        <div>
          <p className="text-ink-3 mb-0.5">Teléfono</p>
          <p className="text-ink-2 font-medium">{cliente.telefono || '—'}</p>
        </div>
        <div>
          <p className="text-ink-3 mb-0.5">Setter</p>
          <p className="text-ink-2 font-medium">{cliente.setter || '—'}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-3 mb-2">Detalle de pagos</p>
        <div className="space-y-2">
          {(cliente.pagos || []).map((p, i) =>
            p ? (
              <div key={i} className="flex items-center gap-3 text-xs bg-white rounded-lg border border-cream px-3 py-2">
                <span className="text-ink-3 w-14">Cuota {p.n}</span>
                <span className="font-semibold text-ink-1 w-20">{usd(p.monto)}</span>
                <span className="text-ink-3 w-24">{p.fecha || '—'}</span>
                <span className="text-ink-2 flex-1">{p.metodo || '—'}</span>
                <EstadoBadge estado={p.estado} />
              </div>
            ) : null
          )}
        </div>
      </div>

      <ComentarioCell
        nombre={cliente.nombre}
        getComentario={getComentario}
        saveComentario={saveComentario}
        saving={saving}
      />
    </div>
  );
}

export default function SeguimientoClientes({ data = [], months = [] }) {
  const { getComentario, saveComentario, saving } = useComentarios();
  const [search, setSearch] = useState('');
  const [filterMes, setFilterMes] = useState('');
  const [filterFuente, setFilterFuente] = useState('');
  const [filterPrograma, setFilterPrograma] = useState('');
  const [filterCloser, setFilterCloser] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [expanded, setExpanded] = useState(null);

  const fuentes   = useMemo(() => [...new Set(data.map(d => d.fuente).filter(Boolean))].sort(), [data]);
  const programas = useMemo(() => [...new Set(data.map(d => d.programa).filter(Boolean))].sort(), [data]);
  const closers   = useMemo(() => [...new Set(data.map(d => d.closer).filter(Boolean))].sort(), [data]);
  const meses     = useMemo(() => [...new Set(data.map(d => d.ingreso).filter(Boolean))].sort(), [data]);

  const filtered = useMemo(() => {
    return data.filter(c => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.nombre?.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q)) return false;
      }
      if (filterMes     && c.ingreso   !== filterMes)     return false;
      if (filterFuente  && c.fuente    !== filterFuente)  return false;
      if (filterPrograma && c.programa !== filterPrograma) return false;
      if (filterCloser  && c.closer    !== filterCloser)  return false;
      if (filterEstado) {
        const tieneVencido = (c.pagos || []).some(p => p && p.estado === 'Vencido');
        const todosCobrado = (c.pagos || []).filter(Boolean).every(p => p.estado === 'Cobrado');
        if (filterEstado === 'completado' && !todosCobrado) return false;
        if (filterEstado === 'pendiente'  && todosCobrado)  return false;
        if (filterEstado === 'en mora'    && !tieneVencido) return false;
      }
      return true;
    });
  }, [data, search, filterMes, filterFuente, filterPrograma, filterCloser, filterEstado]);

  // Stats
  const stats = useMemo(() => {
    let totalClientes  = data.length;
    let totalVentas    = 0;
    let cobradoARG     = 0;
    let cobradoUSA     = 0;
    let cobradoEfectivo = 0;
    let pendiente      = 0;
    let enMora         = 0;

    data.forEach(c => {
      totalVentas += c.montoTotal || 0;
      const tieneVencido = (c.pagos || []).some(p => p && p.estado === 'Vencido');
      if (tieneVencido) enMora++;
      (c.pagos || []).forEach(p => {
        if (!p) return;
        if (p.estado === 'Cobrado') {
          if (p.clasificacion === 'argentina') cobradoARG += p.monto || 0;
          else if (p.clasificacion === 'usa') cobradoUSA += p.monto || 0;
          else if (p.clasificacion === 'efectivo') cobradoEfectivo += p.monto || 0;
        } else if (p.estado === 'Pendiente' || p.estado === 'Vencido') {
          pendiente += p.monto || 0;
        }
      });
    });

    return { totalClientes, totalVentas, cobradoARG, cobradoUSA, cobradoEfectivo, pendiente, enMora };
  }, [data]);

  const selectCls = 'text-xs border border-cream rounded-full px-3 py-1.5 bg-white text-ink-2 outline-none cursor-pointer focus:border-gold-dark';

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
        {[
          { label: 'Total clientes', val: stats.totalClientes, cls: 'text-ink-1' },
          { label: 'Total ventas',   val: usd(stats.totalVentas),  cls: 'text-ink-1' },
          { label: 'Cobrado ARG',    val: usd(stats.cobradoARG),   cls: 'text-pos' },
          { label: 'Cobrado USA',    val: usd(stats.cobradoUSA),   cls: 'text-gold-dark' },
          { label: 'Cobrado Efec.',  val: usd(stats.cobradoEfectivo), cls: 'text-ink-2' },
          { label: 'Pendiente',      val: usd(stats.pendiente),    cls: 'text-ink-2' },
          { label: 'En mora',        val: stats.enMora,            cls: stats.enMora > 0 ? 'text-neg' : 'text-ink-3' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-cream shadow-sm p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-3 mb-0.5">{s.label}</p>
            <p className={clsx('text-base font-bold', s.cls)}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-cream shadow-sm p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-xs border border-cream rounded-full bg-white text-ink-2 outline-none focus:border-gold-dark"
          />
        </div>
        <select value={filterMes}      onChange={e => setFilterMes(e.target.value)}      className={selectCls}>
          <option value="">Todos los meses</option>
          {meses.map(m => <option key={m} value={m}>{mesLabel(m)}</option>)}
        </select>
        <select value={filterFuente}   onChange={e => setFilterFuente(e.target.value)}   className={selectCls}>
          <option value="">Todas las fuentes</option>
          {fuentes.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={filterPrograma} onChange={e => setFilterPrograma(e.target.value)} className={selectCls}>
          <option value="">Todos los programas</option>
          {programas.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterCloser}   onChange={e => setFilterCloser(e.target.value)}   className={selectCls}>
          <option value="">Todos los closers</option>
          {closers.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterEstado}   onChange={e => setFilterEstado(e.target.value)}   className={selectCls}>
          <option value="">Todos los estados</option>
          <option value="completado">Completado</option>
          <option value="pendiente">Pendiente</option>
          <option value="en mora">En mora</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-cream bg-page">
                {['Cliente', 'Programa', 'Closer', 'Ingreso', 'Monto total', 'Cuotas', '% Cobrado', ''].map(h => (
                  <th key={h} className="pb-2 pt-3 px-3 text-left text-xs text-ink-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-ink-3">
                    No hay clientes que coincidan con los filtros
                  </td>
                </tr>
              )}
              {filtered.map((cliente, i) => {
                const isOpen = expanded === i;
                const cobrado = (cliente.pagos || []).reduce((s, p) => p && p.estado === 'Cobrado' ? s + (p.monto || 0) : s, 0);
                const pct = cliente.montoTotal > 0 ? Math.round((cobrado / cliente.montoTotal) * 100) : 0;
                const tieneVencido = (cliente.pagos || []).some(p => p && p.estado === 'Vencido');

                return [
                  <tr
                    key={`row-${i}`}
                    className={clsx(
                      'border-b border-cream/50 cursor-pointer transition-colors',
                      isOpen ? 'bg-gold-light/30' : 'hover:bg-page',
                      tieneVencido && 'border-l-2 border-l-neg'
                    )}
                    onClick={() => setExpanded(isOpen ? null : i)}
                  >
                    {/* Cliente */}
                    <td className="py-3 px-3">
                      <p className="font-medium text-ink-1 text-sm leading-tight">{cliente.nombre}</p>
                      <div className="mt-0.5"><FuenteBadge fuente={cliente.fuente} /></div>
                    </td>
                    {/* Programa */}
                    <td className="py-3 px-3">
                      <ProgramaBadge programa={cliente.programa} />
                    </td>
                    {/* Closer */}
                    <td className="py-3 px-3 text-xs text-ink-2">{cliente.closer || '—'}</td>
                    {/* Ingreso */}
                    <td className="py-3 px-3 text-xs text-ink-2 whitespace-nowrap">{mesLabel(cliente.ingreso)}</td>
                    {/* Monto total */}
                    <td className="py-3 px-3 font-semibold text-ink-1 whitespace-nowrap">{usd(cliente.montoTotal)}</td>
                    {/* Cuotas dots */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        {(cliente.pagos || [null, null, null, null]).map((p, pi) => (
                          <PagoDot key={pi} estado={p?.estado || null} />
                        ))}
                      </div>
                    </td>
                    {/* % cobrado */}
                    <td className="py-3 px-3 min-w-[130px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-cream rounded-full overflow-hidden">
                          <div className="h-full bg-pos rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-ink-2 w-8 text-right">{pct}%</span>
                      </div>
                      <p className="text-[10px] text-ink-3 mt-0.5">{usd(cobrado)}</p>
                    </td>
                    {/* Chevron */}
                    <td className="py-3 px-3 text-ink-3">
                      {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </td>
                  </tr>,
                  isOpen && (
                    <tr key={`exp-${i}`} className="border-b border-cream/50">
                      <td colSpan={8} className="p-0">
                        <ExpandedRow
                          cliente={cliente}
                          getComentario={getComentario}
                          saveComentario={saveComentario}
                          saving={saving}
                        />
                      </td>
                    </tr>
                  )
                ];
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
