'use client';
import { useMemo, useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import clsx from 'clsx';

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

function mesLabel(key) { return MES_LABELS[key] || key; }

const ESTADO_STYLES = {
  Vencido:  { badge: 'bg-neg-light text-neg',       dot: 'bg-neg' },
  Pendiente:{ badge: 'bg-gold-light text-gold-dark', dot: 'bg-gold' },
  Cobrado:  { badge: 'bg-pos-light text-pos',        dot: 'bg-pos' },
};

function EstadoBadge({ estado }) {
  const s = ESTADO_STYLES[estado] || { badge: 'bg-cream text-ink-3' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.badge}`}>
      {estado}
    </span>
  );
}

// ── Pending payments list ──────────────────────────────────────────────────────

function PendienteRow({ item, comment, onCommentChange }) {
  const [open, setOpen] = useState(false);
  const hasComment = !!comment?.trim();

  return (
    <div className={clsx(
      'border-b border-cream last:border-0',
      item.estado === 'Vencido' ? 'bg-neg-light/10' : 'bg-white'
    )}>
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-page transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className={clsx('w-2.5 h-2.5 rounded-full flex-shrink-0', ESTADO_STYLES[item.estado]?.dot || 'bg-cream')} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-ink-1 text-sm truncate">{item.nombre}</span>
            {item.programa && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-cream text-ink-2 font-medium">{item.programa}</span>
            )}
            {hasComment && (
              <MessageSquare size={12} className="text-gold flex-shrink-0" />
            )}
          </div>
          <div className="text-xs text-ink-3 mt-0.5">
            Cuota {item.n}/{item.totalCuotas}
            {item.fecha ? ` · vence ${item.fecha}` : ' · sin fecha'}
            {item.metodo ? ` · ${item.metodo}` : ''}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-semibold text-ink-1">{usd(item.monto)}</span>
          <EstadoBadge estado={item.estado} />
          {open ? <ChevronUp size={14} className="text-ink-3" /> : <ChevronDown size={14} className="text-ink-3" />}
        </div>
      </div>

      {/* Expanded: comment field */}
      {open && (
        <div className="px-4 pb-3" onClick={e => e.stopPropagation()}>
          <p className="text-xs font-semibold text-ink-3 uppercase tracking-wide mb-1.5">
            Comentario de seguimiento
          </p>
          <textarea
            value={comment || ''}
            onChange={e => onCommentChange(item.nombre, e.target.value)}
            placeholder={`¿Cómo va el cobro con ${item.nombre.split(' ')[0]}? Prometió pagar el...`}
            rows={3}
            className="w-full text-sm border border-cream rounded-lg p-2.5 focus:outline-none focus:border-gold resize-none bg-white placeholder:text-ink-3"
          />
          <p className="text-xs text-ink-3 mt-1">Guardado localmente en este dispositivo</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CobranzasSection({ clientesNuevos = [], recoleccion = [] }) {
  const [sortField, setSortField] = useState('mes');
  const [sortDir, setSortDir] = useState('asc');
  const [filterEstado, setFilterEstado] = useState('todos'); // todos | vencido | pendiente
  const [comments, setComments] = useState({});

  // Load comments from localStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cobranzas-comments') || '{}');
      setComments(saved);
    } catch {}
  }, []);

  function handleCommentChange(nombre, text) {
    setComments(prev => {
      const next = { ...prev, [nombre]: text };
      try { localStorage.setItem('cobranzas-comments', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  // ── Monthly summary rows ──
  const rows = useMemo(() => {
    const map = {};
    function addPagos(dataset) {
      dataset.forEach(cliente => {
        (cliente.pagos || []).forEach(p => {
          if (!p || !p.fechaISO) return;
          const mesKey = p.fechaISO.slice(0, 7);
          if (!mesKey) return;
          if (!map[mesKey]) {
            map[mesKey] = { mes: mesKey, aCobrar: 0, cobradoARG: 0, cobradoUSA: 0, cobradoEfectivo: 0, pendiente: 0, vencido: 0 };
          }
          const row = map[mesKey];
          row.aCobrar += p.monto || 0;
          if (p.estado === 'Cobrado') {
            if (p.clasificacion === 'argentina') row.cobradoARG += p.monto || 0;
            else if (p.clasificacion === 'usa') row.cobradoUSA += p.monto || 0;
            else if (p.clasificacion === 'efectivo') row.cobradoEfectivo += p.monto || 0;
          } else if (p.estado === 'Vencido') {
            row.vencido += p.monto || 0;
          } else {
            row.pendiente += p.monto || 0;
          }
        });
      });
    }
    addPagos(clientesNuevos);
    addPagos(recoleccion);
    return Object.values(map).map(r => ({
      ...r,
      cobradoTotal: r.cobradoARG + r.cobradoUSA + r.cobradoEfectivo,
      pctCobrado: r.aCobrar > 0
        ? Math.round(((r.cobradoARG + r.cobradoUSA + r.cobradoEfectivo) / r.aCobrar) * 100)
        : 0,
    }));
  }, [clientesNuevos, recoleccion]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [rows, sortField, sortDir]);

  function handleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  // ── Pending payments list ──
  const pendientes = useMemo(() => {
    const all = [];
    function collect(dataset) {
      dataset.forEach(cliente => {
        const totalCuotas = (cliente.pagos || []).filter(Boolean).length;
        (cliente.pagos || []).forEach(p => {
          if (!p || !p.monto) return;
          if (p.estado === 'Cobrado') return;
          all.push({
            nombre: cliente.nombre,
            programa: cliente.programa || '',
            n: p.n,
            totalCuotas,
            monto: p.monto,
            fecha: p.fecha || '',
            fechaISO: p.fechaISO || '',
            metodo: p.metodo || '',
            estado: p.estado, // 'Vencido' or 'Pendiente'
          });
        });
      });
    }
    collect(clientesNuevos);
    collect(recoleccion);

    // Sort: vencidos first, then by date asc
    return all.sort((a, b) => {
      if (a.estado === 'Vencido' && b.estado !== 'Vencido') return -1;
      if (a.estado !== 'Vencido' && b.estado === 'Vencido') return 1;
      return (a.fechaISO || '').localeCompare(b.fechaISO || '');
    });
  }, [clientesNuevos, recoleccion]);

  const filteredPendientes = useMemo(() => {
    if (filterEstado === 'todos') return pendientes;
    return pendientes.filter(p => p.estado.toLowerCase() === filterEstado);
  }, [pendientes, filterEstado]);

  const totalVencido = pendientes.filter(p => p.estado === 'Vencido').reduce((s, p) => s + p.monto, 0);
  const totalPendiente = pendientes.filter(p => p.estado === 'Pendiente').reduce((s, p) => s + p.monto, 0);
  const conComentario = pendientes.filter(p => comments[p.nombre]?.trim()).length;

  function SortIcon({ field }) {
    if (sortField !== field) return <span className="text-ink-3 opacity-40 ml-0.5">↕</span>;
    return <span className="text-gold ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  if (rows.length === 0 && pendientes.length === 0) return null;

  const thCls = 'pb-2 px-2 text-left text-xs text-ink-3 font-medium whitespace-nowrap cursor-pointer select-none hover:text-ink-1';

  return (
    <div className="space-y-4">

      {/* Monthly summary table */}
      {rows.length > 0 && (
        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-ink-3 mb-4">
            Estado de cobranzas por mes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-cream">
                  <th className={thCls} onClick={() => handleSort('mes')}>Mes <SortIcon field="mes" /></th>
                  <th className={thCls} onClick={() => handleSort('aCobrar')}>A cobrar <SortIcon field="aCobrar" /></th>
                  <th className={thCls} onClick={() => handleSort('cobradoARG')}>ARG <SortIcon field="cobradoARG" /></th>
                  <th className={thCls} onClick={() => handleSort('cobradoUSA')}>USA <SortIcon field="cobradoUSA" /></th>
                  <th className={thCls} onClick={() => handleSort('cobradoEfectivo')}>Efectivo <SortIcon field="cobradoEfectivo" /></th>
                  <th className={clsx(thCls, 'text-pos')} onClick={() => handleSort('cobradoTotal')}>Cobrado <SortIcon field="cobradoTotal" /></th>
                  <th className={thCls} onClick={() => handleSort('pendiente')}>Pendiente <SortIcon field="pendiente" /></th>
                  <th className={clsx(thCls, 'text-neg')} onClick={() => handleSort('vencido')}>Vencido <SortIcon field="vencido" /></th>
                  <th className={thCls} onClick={() => handleSort('pctCobrado')}>% <SortIcon field="pctCobrado" /></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => (
                  <tr key={r.mes} className="border-b border-cream/50 hover:bg-page transition-colors">
                    <td className="py-2.5 px-2 font-medium text-ink-1 whitespace-nowrap">{mesLabel(r.mes)}</td>
                    <td className="py-2.5 px-2 text-ink-2">{usd(r.aCobrar)}</td>
                    <td className="py-2.5 px-2 text-ink-2">{usd(r.cobradoARG)}</td>
                    <td className="py-2.5 px-2 text-ink-2">{usd(r.cobradoUSA)}</td>
                    <td className="py-2.5 px-2 text-ink-2">{usd(r.cobradoEfectivo)}</td>
                    <td className="py-2.5 px-2 font-semibold text-pos">{usd(r.cobradoTotal)}</td>
                    <td className="py-2.5 px-2 text-ink-2">{usd(r.pendiente)}</td>
                    <td className="py-2.5 px-2 text-neg font-medium">
                      {r.vencido > 0 ? usd(r.vencido) : <span className="text-ink-3">—</span>}
                    </td>
                    <td className="py-2.5 px-2 min-w-[110px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden">
                          <div className="h-full bg-pos rounded-full" style={{ width: `${r.pctCobrado}%` }} />
                        </div>
                        <span className="text-xs font-medium text-ink-2 w-8 text-right">{r.pctCobrado}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending payments list with comments */}
      {pendientes.length > 0 && (
        <div className="bg-white rounded-xl border border-cream shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-cream flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xs font-semibold tracking-widest uppercase text-ink-3">
                Pendientes de cobro
              </h2>
              <p className="text-xs text-ink-3 mt-0.5">
                <span className="text-neg font-medium">{usd(totalVencido)} vencido</span>
                <span className="mx-2 text-cream-dark">·</span>
                <span className="text-gold-dark font-medium">{usd(totalPendiente)} pendiente</span>
                {conComentario > 0 && (
                  <>
                    <span className="mx-2 text-cream-dark">·</span>
                    <span className="text-ink-2">{conComentario} con comentario</span>
                  </>
                )}
              </p>
            </div>
            {/* Filter tabs */}
            <div className="flex gap-1 bg-page rounded-lg p-1">
              {[
                { id: 'todos', label: `Todos (${pendientes.length})` },
                { id: 'vencido', label: `Vencidos (${pendientes.filter(p => p.estado === 'Vencido').length})` },
                { id: 'pendiente', label: `Pendientes (${pendientes.filter(p => p.estado === 'Pendiente').length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterEstado(tab.id)}
                  className={clsx(
                    'text-xs px-3 py-1.5 rounded-md font-medium transition-colors',
                    filterEstado === tab.id
                      ? 'bg-white text-ink-1 shadow-sm'
                      : 'text-ink-3 hover:text-ink-2'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div>
            {filteredPendientes.length === 0 ? (
              <p className="px-4 py-6 text-center text-ink-3 text-sm">Sin resultados para este filtro</p>
            ) : (
              filteredPendientes.map((item, idx) => (
                <PendienteRow
                  key={`${item.nombre}-${item.n}-${idx}`}
                  item={item}
                  comment={comments[item.nombre] || ''}
                  onCommentChange={handleCommentChange}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
