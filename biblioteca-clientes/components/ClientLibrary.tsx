'use client';

import { useState, useMemo } from 'react';
import type { Client } from '@/types/client';
import ClientModal from './ClientModal';

const CATS = [
  'Idiomas', 'Educación & Docencia', 'Psicología', 'Coaching',
  'Salud & Nutrición', 'Fitness & Deporte', 'Estética & Belleza',
  'Marketing & Agencia', 'Arquitectura & Construcción', 'Finanzas & Contable',
  'Consultoría & Negocios', 'Legal', 'Desarrollo & Espiritualidad',
  'Arte & Creatividad', 'Otros',
];

const norm = (s: string) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function igHandle(url: string): string {
  const m = url.match(/instagram\.com\/@?([^/?#\s]+)/i);
  return m ? '@' + m[1] : url;
}

function Hl({ text, q }: { text: string; q: string }) {
  if (!q || !text) return <>{text}</>;
  const n = norm(text), qn = norm(q);
  const i = n.indexOf(qn);
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

export default function ClientLibrary({ initial }: { initial: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initial);
  const [query, setQuery] = useState('');
  const [casoOnly, setCasoOnly] = useState(false);
  const [openKey, setOpenKey] = useState(0);
  const [allOpen, setAllOpen] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; client?: Client }>({ open: false });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const refresh = async () => {
    const res = await fetch('/api/clients');
    if (res.ok) setClients(await res.json());
  };

  const filtered = useMemo(() => {
    const q = norm(query);
    return clients.filter(d => {
      if (casoOnly && !d.x) return false;
      if (!q) return true;
      return norm(`${d.n} ${d.p} ${d.g} ${d.c} ${d.cat} ${d.u} ${d.email}`).includes(q);
    });
  }, [clients, query, casoOnly]);

  const grouped = useMemo(() => {
    const withCat = filtered.filter(d => d.cat);
    const withoutCat = filtered.filter(d => !d.cat);
    const groups = CATS
      .map(cat => ({ cat, items: withCat.filter(d => d.cat === cat) }))
      .filter(g => g.items.length > 0);
    if (withoutCat.length > 0) groups.push({ cat: 'Sin categoría', items: withoutCat });
    return groups;
  }, [filtered]);

  const handleToggleAll = () => {
    const next = !allOpen;
    setAllOpen(next);
    if (!next) setOpenKey(k => k + 1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    setDeleting(id);
    setError('');
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await refresh();
    } else {
      setError('Error al eliminar. Intentá de nuevo.');
    }
    setDeleting(null);
  };

  const totalCasos = clients.filter(d => d.x).length;
  const filteredCasos = filtered.filter(d => d.x).length;

  return (
    <>
      <div className="controls">
        <div className="wrap">
          <div className="searchrow">
            <div className="searchbox">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                id="q"
                type="text"
                placeholder="Buscar por nombre, profesión, nicho, a quién ayuda…"
                autoComplete="off"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <div
              className={`toggle${casoOnly ? ' on' : ''}`}
              onClick={() => setCasoOnly(v => !v)}
              role="button"
            >
              <span className="dot" />
              Solo casos de éxito
            </div>
            <button className="linkbtn" onClick={handleToggleAll}>
              {allOpen ? 'Cerrar todo' : 'Abrir todo'}
            </button>
            <button className="add-btn" onClick={() => setModal({ open: true })}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Agregar cliente</span>
            </button>
          </div>
          <div className="meta">
            {query || casoOnly
              ? <><b>{filtered.length}</b> resultado{filtered.length !== 1 ? 's' : ''} — <b>{filteredCasos}</b> con caso de éxito</>
              : <><b>{clients.length}</b> clientes · <b>{totalCasos}</b> con caso de éxito</>
            }
          </div>
        </div>
      </div>

      <div className="wrap">
        {error && <div className="error-banner" style={{ marginTop: 16 }}>{error}</div>}
        <div className="sections" style={{ marginTop: 16 }}>
          {grouped.length === 0 ? (
            <div className="empty">
              <div className="big">Sin resultados</div>
              Probá con otra búsqueda
            </div>
          ) : (
            grouped.map(({ cat, items }) => {
              const casos = items.filter(d => d.x).length;
              return (
                <details key={`${cat}-${openKey}`} className="nicho" open={allOpen || undefined}>
                  <summary className="nhead">
                    <span className="caret" />
                    <span className="nname">{cat}</span>
                    <span className="ncount">{items.length} cliente{items.length !== 1 ? 's' : ''}</span>
                    {casos > 0 && <span className="ncaso">★ {casos} caso{casos !== 1 ? 's' : ''}</span>}
                  </summary>
                  <div className="nbody">
                    {items.map(d => (
                      <ClientCard
                        key={d.id}
                        client={d}
                        query={query}
                        onEdit={() => setModal({ open: true, client: d })}
                        onDelete={() => handleDelete(d.id)}
                        deleting={deleting === d.id}
                      />
                    ))}
                  </div>
                </details>
              );
            })
          )}
        </div>
      </div>

      {modal.open && (
        <ClientModal
          client={modal.client}
          onClose={() => setModal({ open: false })}
          onSaved={refresh}
        />
      )}
    </>
  );
}

function ClientCard({
  client: d, query, onEdit, onDelete, deleting,
}: {
  client: Client; query: string; onEdit: () => void; onDelete: () => void; deleting: boolean;
}) {
  const handle = d.u ? igHandle(d.u) : '';
  return (
    <div className={`card${d.x ? ' caso' : ''}`}>
      <div className="chead">
        <div className="cname"><Hl text={d.n} q={query} /></div>
        <div className="chead-right">
          <span className={`status ${d.x ? 'si' : 'no'}`}>{d.x ? '★ Caso de éxito' : 'Sin caso'}</span>
          <div className="card-actions">
            <button className="card-btn" onClick={onEdit} title="Editar" type="button">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button className="card-btn danger" onClick={onDelete} title="Eliminar" type="button" disabled={deleting}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {d.p && <div className="prof"><Hl text={d.p} q={query} /></div>}
      {d.u
        ? <div className="ig"><a href={d.u} target="_blank" rel="noopener"><Hl text={handle} q={query} /> ↗</a></div>
        : <div className="noig">sin IG cargado</div>
      }
      {d.c && (
        <div className="field">
          <span className="lab">Ayuda a</span>
          <Hl text={d.c} q={query} />
        </div>
      )}
      {d.email && (
        <div className="email-field">
          <a href={`mailto:${d.email}`}><Hl text={d.email} q={query} /></a>
        </div>
      )}
      {d.t && (
        <div className="test">
          <a href={d.t} target="_blank" rel="noopener">▶ Ver testimonio</a>
        </div>
      )}
    </div>
  );
}
