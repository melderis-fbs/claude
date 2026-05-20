'use client';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MonthSelector from '../ui/MonthSelector.jsx';
import StatCard from '../ui/StatCard.jsx';
import { DollarSign, Calendar, Users, TrendingUp, Target, BarChart2 } from 'lucide-react';

function ars(n) { return `$ ${Number(n || 0).toLocaleString('es-AR')}`; }
function pct(n) { return `${Number(n || 0).toFixed(1)}%`; }
function num(n) { return Number(n || 0).toFixed(2); }

export default function Anuncios({ data = [], months = [], selectedMonth, onMonthChange }) {
  const mes = useMemo(() => data.find(d => d.mes === selectedMonth) || data[0] || {}, [data, selectedMonth]);

  // Chart: tendencia de leads y cierres en los últimos meses
  const chartData = useMemo(
    () => [...data].reverse().slice(-4).map(r => ({
      mes:        r.mesLabel?.split(' ')[0] || r.mes,
      Agendas:    r.agendasCualificadas,
      Asistencias: r.asistencias,
      Cierres:    r.cierres,
    })),
    [data]
  );

  if (!mes.mes) return <p className="text-sm text-gray-400 py-8 text-center">Sin datos de anuncios</p>;

  return (
    <div className="space-y-5">
      <MonthSelector months={months} selected={selectedMonth} onChange={onMonthChange} />

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={DollarSign}  label="Inversión"             value={ars(mes.inversion)}            accent="red"    />
        <StatCard icon={Calendar}    label="Agendas cualificadas"  value={mes.agendasCualificadas}       accent="blue"   />
        <StatCard icon={DollarSign}  label="Costo por agenda"      value={ars(mes.costoAgenda)}          accent="orange" />
        <StatCard icon={Users}       label="Asistencias"           value={mes.asistencias}               accent="purple" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Target}      label="Cierres"               value={mes.cierres}                   accent="teal"   />
        <StatCard icon={BarChart2}   label="% Cierres"             value={pct(mes.pctCierres)}           accent="green"  />
        <StatCard icon={TrendingUp}  label="ROAS"                  value={num(mes.roas)}                 accent="teal"   />
        <StatCard icon={TrendingUp}  label="ROAS Cash"             value={num(mes.roasCash)}             accent="green"  />
      </div>

      {/* Métricas secundarias en cards compactas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Llamadas en calendario', val: mes.llamadasCalendario },
          { label: '% Asistencia',           val: pct(mes.pctAsistencia) },
          { label: 'Costo por asistencia',   val: ars(mes.costoAsistencia) },
          { label: '% LC (Liq. / Llamadas)', val: pct(mes.pctLC) },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-lg font-bold text-gray-900">{val}</p>
          </div>
        ))}
      </div>

      {/* Gráfico tendencia */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Tendencia: agendas → asistencias → cierres</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ right: 10, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="Agendas"     stroke="#60A5FA" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Asistencias" stroke="#A78BFA" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Cierres"     stroke="#0F766E" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla comparativa de meses */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Comparativo de meses</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Mes','Inversión','Agendas calf.','$/Agenda','Llamadas cal.','Asistencias','%Asist.','$/Asist.','Cierres','%Cierres','%LC','ROAS','ROAS Cash'].map(h => (
                  <th key={h} className="pb-2 px-3 text-left text-xs text-gray-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((r, i) => (
                <tr key={r.mes} className={`border-b border-gray-50 ${r.mes === selectedMonth ? 'bg-teal-50/50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="py-2.5 px-3 font-medium text-gray-800 whitespace-nowrap">{r.mesLabel}</td>
                  <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">{ars(r.inversion)}</td>
                  <td className="py-2.5 px-3 text-gray-700">{r.agendasCualificadas}</td>
                  <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">{ars(r.costoAgenda)}</td>
                  <td className="py-2.5 px-3 text-gray-700">{r.llamadasCalendario}</td>
                  <td className="py-2.5 px-3 text-gray-700">{r.asistencias}</td>
                  <td className="py-2.5 px-3 text-gray-700">{pct(r.pctAsistencia)}</td>
                  <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">{ars(r.costoAsistencia)}</td>
                  <td className="py-2.5 px-3 font-semibold text-gray-800">{r.cierres}</td>
                  <td className="py-2.5 px-3"><span className="text-teal-700 font-semibold">{pct(r.pctCierres)}</span></td>
                  <td className="py-2.5 px-3 text-gray-700">{pct(r.pctLC)}</td>
                  <td className="py-2.5 px-3 font-semibold text-gray-800">{num(r.roas)}</td>
                  <td className="py-2.5 px-3 text-gray-700">{num(r.roasCash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 pb-2">
        Última actualización: {new Date().toLocaleString('es-AR')}
      </p>
    </div>
  );
}
