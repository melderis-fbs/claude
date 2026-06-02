'use client';
import { useState, useEffect, useCallback } from 'react';

// key format: "tipo|nombre"
export function useComentarios() {
  const [comentarios, setComentarios] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => {
    fetch('/api/comentarios')
      .then(r => r.json())
      .then(j => {
        if (j.data && typeof j.data === 'object') setComentarios(j.data);
        else {
          // fallback: load from localStorage
          try {
            const stored = localStorage.getItem('comentarios-v2');
            if (stored) setComentarios(JSON.parse(stored));
          } catch(e) {}
        }
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem('comentarios-v2');
          if (stored) setComentarios(JSON.parse(stored));
        } catch(e) {}
      });
  }, []);

  const getComentario = useCallback((tipo, nombre) => {
    const key = tipo + '|' + nombre;
    const entry = comentarios[key];
    return entry ? entry.texto || entry : '';
  }, [comentarios]);

  const saveComentario = useCallback(async (tipo, nombre, texto) => {
    const key = tipo + '|' + nombre;
    setComentarios(prev => ({ ...prev, [key]: { tipo, nombre, texto } }));
    setSaving(prev => ({ ...prev, [key]: true }));

    try {
      await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, nombre, texto }),
      });
      // also save to localStorage as backup
      try {
        const stored = JSON.parse(localStorage.getItem('comentarios-v2') || '{}');
        stored[key] = { tipo, nombre, texto };
        localStorage.setItem('comentarios-v2', JSON.stringify(stored));
      } catch(e) {}
    } catch(e) {
      // fallback to localStorage only
      try {
        const stored = JSON.parse(localStorage.getItem('comentarios-v2') || '{}');
        stored[key] = { tipo, nombre, texto };
        localStorage.setItem('comentarios-v2', JSON.stringify(stored));
      } catch(e2) {}
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  }, []);

  return { getComentario, saveComentario, saving };
}
