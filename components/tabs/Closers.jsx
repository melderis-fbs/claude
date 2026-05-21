'use client';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const medals = ['🥇', '🥈', '🥉'];

function Initials({ name }) {
  const parts = (name || '').split(' ');
  const ini = parts.slice(0, 2).map(p => p[0] || '').join('').toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full bg-gold-light text-gold-dark flex items-center justify-center font-bold text-lg mx-auto mb-2">
      {ini}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-cream rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-ink-2 mb-1">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function Closers({ data = [], months = [], selectedMonth, onMonthChange }) {
  const filtered = useMemo(() => data.filter(d => d.mes === selectedMonth), [data, selectedMonth]);
  const sorted   = useMemo(() => [...filtered].sort((a, b) => b.cierres - a.cierres), [filtered]);

  const chartData = sorted.map(c => ({
    name:      c.closer.split(' ')[0],
    Agendadas: c.agendadas,
    Asistencias: c.asistencias,
    Cierres:   c.cierres,
  }));

  return (
    <div className="space-y-5">

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sorted.map((c, i) => (
          <div key={c.closer} className="bg-white rounded-xl border border-cream shadow-sm p-4 text-center relative">
            {i < 3 && <span className="absolute top-2 right-2 text-lg">{medals[i]}</span>}
            <Initials name={c.closer} />
            <p className="text-sm font-semibold text-ink-1 truncate">{c.closer}</p>

            <div className="grid grid-cols-2 gap-1.5 mt-3">
              {[
                { label: 'Agendadas',   val: c.agendadas,      bg: 'bg-page',      text: 'text-ink-1' },
                { label: 'Asistencias', val: c.asistencias,    bg: 'bg-cream',     text: 'text-ink-2' },
                { label: 'Reagenda',    val: c.reagenda,       bg: 'bg-gold-light', text: 'text-gold-dark' },
                { label: '2da llamada', val: c.segundaLlamada, bg: 'bg-cream',     text: 'text-ink-2' },
                { label: 'Ofertas',     val: c.ofertas,        bg: 'bg-gold-light', text: 'text-gold-dark' },
                { label: 'Seña',        val: c.senia,          bg: 'bg-pos-light',  text: 'text-pos'  },
              ].map(({ label, val, bg, text }) => (
                <div key={label} className={`${bg} rounded-lg p-1.5`}>
                  <p className={`text-base font-bold ${text}`}>{val}</p>
                  <p className="text-xs text-ink-3">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <div className="bg-gold-light rounded-lg p-2">
                <p className="text-xl font-bold text-gold-dark">{c.cierres}</p>
                <p className="text-xs text-ink-3">cierres</p>
              </div>
              <div className="bg-gold-light rounded-lg p-2">
                <p className="text-xl font-bold text-gold-dark">{c.pctCierre}%</p>
                <p className="text-xs text-ink-3">% cierre</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-ink-3">% asistencia: <span className="font-semibold text-ink-2">{c.pctAsistencia}%</span></p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <h2 className="text-sm font-semibold text-ink-2 mb-3">Ranking del mes</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-cream">
                  {['#','Closer','Agendadas','Asist.','Reagenda','2da','Ofertas','Seña','Cierres','%Cierre','%Asist.'].map(h => (
                    <th key={h} className="pb-2 px-2 text-left text-xs text-ink-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => (
                  <tr key={c.closer} className="border-b border-cream/50">
                    <td className="py-2 px-2">{medals[i] || i + 1}</td>
                    <td className="py-2 px-2 font-medium text-ink-1 whitespace-nowrap">{c.closer}</td>
                    <td className="py-2 px-2 text-ink-2">{c.agendadas}</td>
                    <td className="py-2 px-2 text-ink-2">{c.asistencias}</td>
                    <td className="py-2 px-2 text-ink-2">{c.reagenda}</td>
                    <td className="py-2 px-2 text-ink-2">{c.segundaLlamada}</td>
                    <td className="py-2 px-2 text-ink-2">{c.ofertas}</td>
                    <td className="py-2 px-2 text-ink-2">{c.senia}</td>
                    <td className="py-2 px-2 font-semibold text-ink-1">{c.cierres}</td>
                    <td className="py-2 px-2"><span className="text-gold-dark font-semibold">{c.pctCierre}%</span></td>
                    <td className="py-2 px-2 text-ink-2">{c.pctAsistencia}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-cream shadow-sm p-4">
          <h2 className="text-sm font-semibold text-ink-2 mb-4">Comparativo del mes</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={14} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Agendadas"   fill="#E8E2D9" radius={[4,4,0,0]} />
              <Bar dataKey="Asistencias" fill="#C4B49A" radius={[4,4,0,0]} />
              <Bar dataKey="Cierres"     fill="#B8960C" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
