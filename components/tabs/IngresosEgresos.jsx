'use client';
import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MonthSelector from '../ui/MonthSelector.jsx';
import StatCard from '../ui/StatCard.jsx';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

function formatARS(n) {
  return `$ ${Number(n || 0).toLocaleString('es-AR')}`;
}

const CATEGORY_COLORS = {
  'Marketing': '#0F766E',
  'Sueldos': '#3B82F6',
  'Herramientas': '#8B5CF6',
  'Publicidad': '#F59E0B',
  'Operaciones': '#EC4899',
  'Impuestos': '#EF4444',
};
const FALLBACK_COLORS = ['#0F766E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#EF4444'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }}>{formatARS(payload[0].value)}</p>
    </div>
  );
};

export default function IngresosEgresos({ data = {}, months = [], selectedMonth, onMonthChange }) {
  const monthData = useMemo(() => {
    if (!data || !selectedMonth) return { ingresos: [], egresos: [] };
    return data[selectedMonth] || { ingresos: [], egresos: [] };
  }, [data, selectedMonth]);

  const totalIngresos = useMemo(
    () => monthData.ingresos.reduce((s, r) => s + (r.monto || 0), 0),
    [monthData.ingresos]
  );
  const totalEgresos = useMemo(
    () => monthData.egresos.reduce((s, r) => s + (r.monto || 0), 0),
    [monthData.egresos]
  );
  const balance = totalIngresos - totalEgresos;

  const pieData = useMemo(() => {
    const groups = {};
    monthData.egresos.forEach(e => {
      const cat = e.categoria || 'Otros';
      groups[cat] = (groups[cat] || 0) + (e.monto || 0);
    });
    return Object.entries(groups).map(([name, value], i) => ({
      name,
      value,
      fill: CATEGORY_COLORS[name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    }));
  }, [monthData.egresos]);

  return (
    <div className="space-y-5">
      <MonthSelector months={months} selected={selectedMonth} onChange={onMonthChange} />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Total ingresos"
          value={formatARS(totalIngresos)}
          accent="green"
        />
        <StatCard
          icon={TrendingDown}
          label="Total egresos"
          value={formatARS(totalEgresos)}
          accent="red"
        />
        <StatCard
          icon={Scale}
          label="Balance"
          value={formatARS(balance)}
          accent={balance >= 0 ? 'teal' : 'red'}
        />
      </div>

      {/* Donut chart */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Egresos por categoría</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ingresos */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-green-600" />
            Ingresos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-max">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left text-xs text-gray-400 font-medium">Fecha</th>
                  <th className="pb-2 text-left text-xs text-gray-400 font-medium">Concepto</th>
                  <th className="pb-2 text-right text-xs text-gray-400 font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {monthData.ingresos.length === 0 ? (
                  <tr><td colSpan={3} className="py-6 text-center text-gray-400 text-xs">Sin ingresos registrados</td></tr>
                ) : (
                  monthData.ingresos.map((r, i) => (
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="py-2 pr-3 text-gray-500 text-xs whitespace-nowrap">{r.fecha}</td>
                      <td className="py-2 pr-3 text-gray-700 max-w-[160px] truncate">{r.concepto}</td>
                      <td className="py-2 text-right text-green-700 font-medium whitespace-nowrap">{formatARS(r.monto)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {monthData.ingresos.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={2} className="pt-2 text-xs font-semibold text-gray-600">Total</td>
                    <td className="pt-2 text-right text-green-700 font-bold whitespace-nowrap">{formatARS(totalIngresos)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Egresos */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingDown size={14} className="text-red-500" />
            Egresos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-max">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left text-xs text-gray-400 font-medium">Fecha</th>
                  <th className="pb-2 text-left text-xs text-gray-400 font-medium">Concepto</th>
                  <th className="pb-2 text-left text-xs text-gray-400 font-medium">Categoría</th>
                  <th className="pb-2 text-right text-xs text-gray-400 font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {monthData.egresos.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-400 text-xs">Sin egresos registrados</td></tr>
                ) : (
                  monthData.egresos.map((r, i) => (
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="py-2 pr-3 text-gray-500 text-xs whitespace-nowrap">{r.fecha}</td>
                      <td className="py-2 pr-3 text-gray-700 max-w-[120px] truncate">{r.concepto}</td>
                      <td className="py-2 pr-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: (CATEGORY_COLORS[r.categoria] || '#6B7280') + '20',
                            color: CATEGORY_COLORS[r.categoria] || '#6B7280',
                          }}
                        >
                          {r.categoria}
                        </span>
                      </td>
                      <td className="py-2 text-right text-red-600 font-medium whitespace-nowrap">{formatARS(r.monto)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {monthData.egresos.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={3} className="pt-2 text-xs font-semibold text-gray-600">Total</td>
                    <td className="pt-2 text-right text-red-600 font-bold whitespace-nowrap">{formatARS(totalEgresos)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 pb-2">
        Última actualización: {new Date().toLocaleString('es-AR')}
      </p>
    </div>
  );
}
