'use client';
import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, Phone, Users, Megaphone, Wallet, RefreshCw } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import TabNav from './ui/TabNav.jsx';
import MonthSelector from './ui/MonthSelector.jsx';
import Overview from './tabs/Overview.jsx';
import Agendas from './tabs/Agendas.jsx';
import LlamadasSeguimientos from './tabs/LlamadasSeguimientos.jsx';
import Closers from './tabs/Closers.jsx';
import Anuncios from './tabs/Anuncios.jsx';
import IngresosEgresos from './tabs/IngresosEgresos.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'agendas', label: 'Agendas', icon: Calendar },
  { id: 'llamadas', label: 'Llamadas y Seguimientos', icon: Phone },
  { id: 'closers', label: 'Closers', icon: Users },
  { id: 'anuncios', label: 'Anuncios', icon: Megaphone },
  { id: 'ingresos', label: 'Ingresos y Egresos', icon: Wallet },
];

function getMonthsList() {
  const now = new Date();
  return [0, 1, 2, 3].map(i => {
    const d = subMonths(now, i);
    const label = format(d, 'MMMM yyyy', { locale: es });
    return {
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value: format(d, 'yyyy-MM'),
      date: d,
    };
  });
}

export default function Dashboard({ negocio, agendas, llamadas, closers, anuncios, ingresosEgresos }) {
  const [activeTab, setActiveTab] = useState('overview');
  const months = useMemo(() => getMonthsList(), []);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const withData = (negocio || []).filter(r => (r.ventasTotales || 0) > 0 || (r.ventasTotal || 0) > 0 || (r.cashCollected || 0) > 0);
    if (withData.length > 0) return [...withData].sort((a, b) => b.mes.localeCompare(a.mes))[0].mes;
    return months[0].value;
  });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRefresh() {
    startTransition(() => { router.refresh(); });
  }

  const today = format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <header className="bg-white border-b border-cream sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-ink-1 text-white text-sm font-bold flex-shrink-0">F</span>
            <div>
              <h1 className="text-lg font-bold text-ink-1 leading-tight">Dashboard Comercial</h1>
              <p className="text-xs text-ink-3 capitalize">{todayCapitalized}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MonthSelector months={months} selected={selectedMonth} onChange={setSelectedMonth} />
            <button
              onClick={handleRefresh}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-ink-1 bg-white text-ink-1 text-xs font-semibold hover:bg-ink-1 hover:text-white transition-colors disabled:opacity-60 flex-shrink-0"
              title="Actualizar datos"
            >
              <RefreshCw size={13} className={isPending ? 'animate-spin' : ''} />
              {isPending ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
        </div>
        <TabNav tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5">
        {activeTab === 'overview' && (
          <Overview negocio={negocio} anuncios={anuncios} closers={closers} selectedMonth={selectedMonth} />
        )}
        {activeTab === 'agendas' && (
          <Agendas data={agendas} />
        )}
        {activeTab === 'llamadas' && (
          <LlamadasSeguimientos data={llamadas} />
        )}
        {activeTab === 'closers' && (
          <Closers data={closers} months={months} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        )}
        {activeTab === 'anuncios' && (
          <Anuncios data={anuncios} months={months} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        )}
        {activeTab === 'ingresos' && (
          <IngresosEgresos data={ingresosEgresos} months={months} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        )}
      </main>
    </div>
  );
}
