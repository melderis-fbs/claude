'use client';
import { useState, useEffect, useCallback } from 'react';

// ── Estructura de filas ────────────────────────────────────────────────────────
const INGRESOS_ROWS = ['Cuotas', 'Venta nueva', 'Otros', 'Proyectado'];

const EGRESOS_SECTIONS = [
  {
    key: 'operativos',
    label: 'Operativos',
    rows: ['Sueldos', 'Alquiler', 'Formación', 'Herramientas', 'Publicidad', 'Otros'],
  },
  {
    key: 'impositivos',
    label: 'Impositivos',
    rows: ['Autónomos', 'IIBB', 'IVA', 'Compra FCS', 'Otros'],
  },
  {
    key: 'personal',
    label: 'Personal',
    rows: ['Retiros', 'Fondos'],
  },
];

const MONEDAS = ['ARS', 'USD', 'USD ARG'];

// ── localStorage helpers ───────────────────────────────────────────────────────
const STORAGE_KEY = 'cashflow_v1';

function loadAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function emptyMes() {
  const moneda = {};
  for (const m of MONEDAS) {
    moneda[m] = {
      saldoInicial: '',
      ingresos: Object.fromEntries(INGRESOS_ROWS.map(r => [r, ''])),
      egresos: Object.fromEntries(
        EGRESOS_SECTIONS.map(s => [s.key, Object.fromEntries(s.rows.map(r => [r, '']))])
      ),
    };
  }
  return moneda;
}

function getMesData(all, mes) {
  return all[mes] || emptyMes();
}

// ── Cálculos ──────────────────────────────────────────────────────────────────
function num(v) { return parseFloat(String(v).replace(/[^0-9.-]/g, '')) || 0; }

function calcTotales(mesData, moneda) {
  const d = mesData[moneda];
  if (!d) return { totalIngresos: 0, totalEgresos: 0, saldoFinal: 0 };
  const totalIngresos = INGRESOS_ROWS.reduce((s, r) => s + num(d.ingresos?.[r]), 0);
  const totalEgresos  = EGRESOS_SECTIONS.reduce((s, sec) =>
    s + sec.rows.reduce((ss, r) => ss + num(d.egresos?.[sec.key]?.[r]), 0), 0);
  const saldoFinal = num(d.saldoInicial) + totalIngresos - totalEgresos;
  return { totalIngresos, totalEgresos, saldoFinal };
}

// ── Mes helpers ───────────────────────────────────────────────────────────────
function mesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function mesLabel(mes) {
  const [y, m] = mes.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

function mesAnterior(mes) {
  const [y, m] = mes.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function mesSiguiente(mes) {
  const [y, m] = mes.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtNum(n) {
  if (n === 0) return '—';
  return n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

function fmtColor(n) {
  if (n > 0)  return 'text-emerald-700';
  if (n < 0)  return 'text-red-600';
  return 'text-gray-400';
}

// ── Celda editable ────────────────────────────────────────────────────────────
function EditCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function start() { setDraft(String(value || '')); setEditing(true); }
  function commit() {
    setEditing(false);
    onChange(draft);
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-full text-right text-sm px-2 py-1 border border-blue-400 rounded outline-none bg-blue-50"
        placeholder="0"
      />
    );
  }

  const n = num(value);
  return (
    <div
      onClick={start}
      className={`text-right text-sm px-2 py-1 rounded cursor-pointer hover:bg-gray-100 min-w-[80px] ${n === 0 ? 'text-gray-300' : 'text-gray-800'}`}
    >
      {n === 0 ? '—' : n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function Cashflow() {
  const [mes, setMes]         = useState(mesActual);
  const [moneda, setMoneda]   = useState('ARS');
  const [all, setAll]         = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setAll(loadAll()); setMounted(true); }, []);

  const mesData = getMesData(all, mes);
  const d       = mesData[moneda] || { saldoInicial: '', ingresos: {}, egresos: {} };
  const { totalIngresos, totalEgresos, saldoFinal } = calcTotales(mesData, moneda);

  function update(updater) {
    setAll(prev => {
      const next = { ...prev };
      const mData = { ...(next[mes] || emptyMes()) };
      const mMon  = { ...(mData[moneda] || emptyMes()[moneda]) };
      updater(mMon);
      mData[moneda] = mMon;
      next[mes] = mData;
      saveAll(next);
      return next;
    });
  }

  function setSaldoInicial(v) {
    update(m => { m.saldoInicial = v; });
  }

  function setIngreso(row, v) {
    update(m => { m.ingresos = { ...m.ingresos, [row]: v }; });
  }

  function setEgreso(sec, row, v) {
    update(m => {
      m.egresos = {
        ...m.egresos,
        [sec]: { ...(m.egresos?.[sec] || {}), [row]: v },
      };
    });
  }

  function copiarSaldoAlSiguiente() {
    const sig = mesSiguiente(mes);
    setAll(prev => {
      const next = { ...prev };
      const sigData = { ...(next[sig] || emptyMes()) };
      const sigMon  = { ...(sigData[moneda] || emptyMes()[moneda]) };
      sigMon.saldoInicial = String(saldoFinal);
      sigData[moneda] = sigMon;
      next[sig] = sigData;
      saveAll(next);
      return next;
    });
  }

  if (!mounted) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setMes(mesAnterior(mes))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            ‹
          </button>
          <span className="text-base font-semibold text-gray-800 capitalize min-w-[160px] text-center">
            {mesLabel(mes)}
          </span>
          <button onClick={() => setMes(mesSiguiente(mes))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            ›
          </button>
        </div>

        {/* Selector de moneda */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {MONEDAS.map(m => (
            <button key={m} onClick={() => setMoneda(m)}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                moneda === m ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Saldo inicial', value: num(d.saldoInicial), neutral: true },
          { label: 'Total ingresos', value: totalIngresos, green: true },
          { label: 'Total egresos', value: totalEgresos, red: true },
          { label: 'Saldo final', value: saldoFinal },
        ].map(({ label, value, neutral, green, red }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className={`text-lg font-bold ${
              neutral ? 'text-gray-700' :
              green   ? 'text-emerald-700' :
              red     ? 'text-red-600' :
              fmtColor(value)
            }`}>
              {value === 0 ? '—' : value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </div>
          </div>
        ))}
      </div>

      {/* Tabla principal */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        {/* Saldo inicial */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Saldo inicial</span>
          <EditCell value={d.saldoInicial} onChange={setSaldoInicial} />
        </div>

        {/* INGRESOS */}
        <div className="border-b border-gray-200">
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Ingresos</span>
          </div>
          {INGRESOS_ROWS.map(row => (
            <div key={row} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-700">{row}</span>
              <EditCell value={d.ingresos?.[row]} onChange={v => setIngreso(row, v)} />
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50">
            <span className="text-sm font-semibold text-emerald-700">Total ingresos</span>
            <span className="text-sm font-bold text-emerald-700 pr-2">{fmtNum(totalIngresos)}</span>
          </div>
        </div>

        {/* EGRESOS */}
        <div>
          {EGRESOS_SECTIONS.map((sec, si) => {
            const secTotal = sec.rows.reduce((s, r) => s + num(d.egresos?.[sec.key]?.[r]), 0);
            return (
              <div key={sec.key} className={si < EGRESOS_SECTIONS.length - 1 ? 'border-b border-gray-200' : ''}>
                <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                    Egresos — {sec.label}
                  </span>
                </div>
                {sec.rows.map(row => (
                  <div key={row} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-700">{row}</span>
                    <EditCell value={d.egresos?.[sec.key]?.[row]} onChange={v => setEgreso(sec.key, row, v)} />
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-2.5 bg-red-50">
                  <span className="text-sm font-semibold text-red-600">Subtotal {sec.label}</span>
                  <span className="text-sm font-bold text-red-600 pr-2">{fmtNum(secTotal)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Saldo final */}
        <div className={`flex items-center justify-between px-4 py-4 border-t-2 border-gray-300 ${saldoFinal >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <span className="text-sm font-bold text-gray-800">Saldo final</span>
          <span className={`text-base font-bold pr-2 ${fmtColor(saldoFinal)}`}>
            {saldoFinal === 0 ? '—' : saldoFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Acción: copiar saldo al mes siguiente */}
      <div className="flex justify-end">
        <button
          onClick={copiarSaldoAlSiguiente}
          className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          Copiar saldo final → {mesLabel(mesSiguiente(mes))}
        </button>
      </div>

    </div>
  );
}
