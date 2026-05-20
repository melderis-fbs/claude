'use client';
import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import MonthSelector from '../ui/MonthSelector.jsx';
import DataTable from '../ui/DataTable.jsx';
import StatCard from '../ui/StatCard.jsx';
import { TrendingUp, Users, MousePointer, DollarSign } from 'lucide-react';

function formatARS(n) {
  if (typeof n !== 'number' && isNaN(n)) return '$ 0';
  const num = typeof n === 'string' ? parseInt(n) : n;
  return `$ ${num.toLocaleString('es-AR')}`;
}

function sumField(arr, field) {
  return arr.reduce((acc, r) => acc + (parseFloat(r[field]) || 0), 0);
}

export default function Anuncios({ data, months, selectedMonth, onMonthChange }) {
  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(d => d.mes === selectedMonth);
  }, [data, selectedMonth]);

  const totals = useMemo(() => {
    const inversion = sumField(filtered, 'inversion');
    const impresiones = sumField(filtered, 'impresiones');
    const clics = sumField(filtered, 'clics');
    const leads = sumField(filtered, 'leads');
    return {
      inversion,
      impresiones,
      clics,
      cpm: impresiones > 0 ? ((inversion / impresiones) * 1000).toFixed(0) : '0',
      cpc: clics > 0 ? (inversion / clics).toFixed(0) : '0',
      ctr: impresiones > 0 ? ((clics / impresiones) * 100).toFixed(2) : '0',
      leads,
      cpl: leads > 0 ? (inversion / leads).toFixed(0) : '0',
    };
  }, [filtered]);

  const chartData = filtered.map(r => ({
    semana: r.semana,
    leads: r.leads,
    inversion: r.inversion,
  }));

  const columns = [
    { key: 'semana', label: 'Semana' },
    { key: 'inversion', label: 'Inversión', sortable: true, render: v => formatARS(typeof v === 'string' ? parseInt(v) : v) },
    { key: 'impresiones', label: 'Impresiones', sortable: true, render: v => parseInt(v).toLocaleString('es-AR') },
    { key: 'clics', label: 'Clics', sortable: true },
    { key: 'cpm', label: 'CPM', sortable: true, render: v => `$ ${parseInt(v).toLocaleString('es-AR')}` },
    { key: 'cpc', label: 'CPC', sortable: true, render: v => `$ ${parseInt(v).toLocaleString('es-AR')}` },
    { key: 'ctr', label: 'CTR', sortable: true, render: v => `${parseFloat(v).toFixed(2)}%` },
    { key: 'leads', label: 'Leads', sortable: true },
    { key: 'cpl', label: 'CPL', sortable: true, render: v => `$ ${parseInt(v).toLocaleString('es-AR')}` },
  ];

  return (
    <div className="space-y-5">
      <MonthSelector months={months} selected={selectedMonth} onChange={onMonthChange} />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={DollarSign} label="Inversión total" value={formatARS(totals.inversion)} accent="teal" />
        <StatCard icon={TrendingUp} label="Impresiones" value={totals.impresiones.toLocaleString('es-AR')} accent="blue" />
        <StatCard icon={MousePointer} label="Clics" value={totals.clics.toLocaleString('es-AR')} accent="purple" />
        <StatCard icon={Users} label="Leads" value={totals.leads} accent="green" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">CPM</div>
          <div className="text-lg font-bold text-gray-900">$ {parseInt(totals.cpm).toLocaleString('es-AR')}</div>
          <div className="text-xs text-gray-400">Costo por mil impresiones</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">CPC</div>
          <div className="text-lg font-bold text-gray-900">$ {parseInt(totals.cpc).toLocaleString('es-AR')}</div>
          <div className="text-xs text-gray-400">Costo por clic</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">CTR</div>
          <div className="text-lg font-bold text-gray-900">{parseFloat(totals.ctr).toFixed(2)}%</div>
          <div className="text-xs text-gray-400">Click-through rate</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">CPL</div>
          <div className="text-lg font-bold text-gray-900">$ {parseInt(totals.cpl).toLocaleString('es-AR')}</div>
          <div className="text-xs text-gray-400">Costo por lead</div>
        </div>
      </div>

      {/* Line chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Leads por semana</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 0, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="leads" name="Leads" stroke="#0f766e" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Detalle por semana</h3>
        <DataTable columns={columns} data={filtered} />
      </div>

      <p className="text-center text-xs text-gray-400 pb-2">
        Última actualización: {new Date().toLocaleString('es-AR')}
      </p>
    </div>
  );
}
