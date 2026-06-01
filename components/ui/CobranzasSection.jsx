'use client';
import { useMemo, useState } from 'react';
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

export default function CobranzasSection({ clientesNuevos = [], recoleccion = [] }) {
  const [sortField, setSortField] = useState('mes');
  const [sortDir, setSortDir] = useState('asc');

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
      let av = a[sortField], bv = b[sortField];
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [rows, sortField, sortDir]);

  function handleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <span className="text-ink-3 opacity-40 ml-0.5">↕</span>;
    return <span className="text-gold ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  if (rows.length === 0) return null;

  const thCls = 'pb-2 px-2 text-left text-xs text-ink-3 font-medium whitespace-nowrap cursor-pointer select-none hover:text-ink-1';

  return (
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
              <th className={clsx(thCls, 'text-argentina')} onClick={() => handleSort('cobradoARG')}>ARG <SortIcon field="cobradoARG" /></th>
              <th className={clsx(thCls, 'text-gold-dark')} onClick={() => handleSort('cobradoUSA')}>USA <SortIcon field="cobradoUSA" /></th>
              <th className={clsx(thCls, 'text-ink-2')} onClick={() => handleSort('cobradoEfectivo')}>Efectivo <SortIcon field="cobradoEfectivo" /></th>
              <th className={clsx(thCls, 'text-pos')} onClick={() => handleSort('cobradoTotal')}>Cobrado <SortIcon field="cobradoTotal" /></th>
              <th className={clsx(thCls, 'text-ink-2')} onClick={() => handleSort('pendiente')}>Pendiente <SortIcon field="pendiente" /></th>
              <th className={clsx(thCls, 'text-neg')} onClick={() => handleSort('vencido')}>Vencido <SortIcon field="vencido" /></th>
              <th className={thCls} onClick={() => handleSort('pctCobrado')}>% Cobrado <SortIcon field="pctCobrado" /></th>
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
                <td className="py-2.5 px-2 text-neg font-medium">{r.vencido > 0 ? usd(r.vencido) : <span className="text-ink-3">—</span>}</td>
                <td className="py-2.5 px-2 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pos rounded-full"
                        style={{ width: `${r.pctCobrado}%` }}
                      />
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
  );
}
