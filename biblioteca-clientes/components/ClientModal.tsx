'use client';

import { useState } from 'react';
import type { Client } from '@/types/client';

const CATS = [
  'Idiomas', 'Educación & Docencia', 'Psicología', 'Coaching',
  'Salud & Nutrición', 'Fitness & Deporte', 'Estética & Belleza',
  'Marketing & Agencia', 'Arquitectura & Construcción', 'Finanzas & Contable',
  'Consultoría & Negocios', 'Legal', 'Desarrollo & Espiritualidad',
  'Arte & Creatividad', 'Otros',
];

type FormData = Omit<Client, 'id'>;
const EMPTY: FormData = { n: '', p: '', g: '', c: '', cat: '', u: '', email: '', x: false, t: '' };

export default function ClientModal({
  client, onClose, onSaved,
}: {
  client?: Client; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormData>(
    client
      ? { n: client.n, p: client.p, g: client.g, c: client.c, cat: client.cat, u: client.u, email: client.email, x: client.x, t: client.t }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.n.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = client
        ? await fetch(`/api/clients/${client.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          })
        : await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          });
      if (!res.ok) throw new Error();
      await onSaved();
      onClose();
    } catch {
      setError('No se pudo guardar. Verificá la conexión con Notion.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{client ? 'Editar cliente' : 'Agregar cliente'}</div>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Cerrar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <div className="form-field">
            <label className="form-label">Nombre *</label>
            <input className="form-input" value={form.n} onChange={e => set('n', e.target.value)} placeholder="Ej: María García" required autoFocus />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Profesión</label>
              <input className="form-input" value={form.p} onChange={e => set('p', e.target.value)} placeholder="Ej: Coach de vida" />
            </div>
            <div className="form-field">
              <label className="form-label">Nicho</label>
              <select className="form-select" value={form.cat} onChange={e => set('cat', e.target.value)}>
                <option value="">— Sin nicho —</option>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Negocio</label>
            <textarea className="form-textarea" value={form.g} onChange={e => set('g', e.target.value)} placeholder="Descripción del negocio…" />
          </div>
          <div className="form-field">
            <label className="form-label">A quién ayuda</label>
            <textarea className="form-textarea" value={form.c} onChange={e => set('c', e.target.value)} placeholder="Descripción del cliente ideal…" />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Instagram (URL)</label>
              <input className="form-input" type="url" value={form.u} onChange={e => set('u', e.target.value)} placeholder="https://instagram.com/usuario" />
            </div>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@ejemplo.com" />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">URL Testimonio</label>
            <input className="form-input" type="url" value={form.t} onChange={e => set('t', e.target.value)} placeholder="https://…" />
          </div>
          <label className="form-checkbox-row">
            <input type="checkbox" checked={form.x} onChange={e => set('x', e.target.checked)} />
            <span className="form-checkbox-label">Tiene caso de éxito</span>
          </label>
          {error && <div className="error-banner">{error}</div>}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : client ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
