import path from 'path';
import fs from 'fs';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { getUltimoNumero, appendDocumento } from '../../../../lib/sheets.js';
import InvoiceDocument from '../../../../components/pdf/InvoiceDocument.jsx';
import ReciboDocument from '../../../../components/pdf/ReciboDocument.jsx';

export const dynamic = 'force-dynamic';

const NUMERO_CONFIG = {
  Invoice: {
    format: (n) => String(n).padStart(8, '0'),
    parse: (s) => parseInt(String(s).replace(/\D/g, ''), 10) || 0,
  },
  Recibo: {
    format: (n) => '000-' + String(n).padStart(3, '0'),
    parse: (s) => parseInt(String(s).split('-').pop(), 10) || 0,
  },
};

function getAssetPath(filename) {
  const p = path.join(process.cwd(), 'public', filename);
  return fs.existsSync(p) ? p : null;
}

export async function POST(request) {
  try {
    const { tipo, formData, moneda } = await request.json();

    if (!['Invoice', 'Recibo'].includes(tipo)) {
      return Response.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    const config = NUMERO_CONFIG[tipo];
    const ultimoNumero = await getUltimoNumero(tipo).catch(() => null);
    const lastN = ultimoNumero ? config.parse(ultimoNumero) : 0;
    const numero = config.format(lastN + 1);

    const firmaSrc = getAssetPath('firma-victoria.png');
    const logoSrc = getAssetPath('founders-logo.png');

    const docElement =
      tipo === 'Invoice'
        ? React.createElement(InvoiceDocument, {
            data: { ...formData, numero, moneda },
            firmaSrc,
            logoSrc,
          })
        : React.createElement(ReciboDocument, {
            data: { ...formData, numero, moneda },
            logoSrc,
          });

    const buffer = await renderToBuffer(docElement);

    // Log to Sheet (non-blocking — don't fail the PDF if this errors)
    const items = formData.items ?? [];
    const descripcion = items
      .map((i) => i.description)
      .filter(Boolean)
      .join(', ');

    appendDocumento([
      tipo,
      numero,
      formData.fecha ?? new Date().toLocaleDateString('es-AR'),
      formData.nombre ?? '',
      formData.email ?? '',
      formData.telefono ?? '',
      tipo === 'Invoice' ? (formData.dni ?? '') : '',
      descripcion,
      moneda,
      Number(formData.subtotal ?? 0),
      Number(formData.taxAmount ?? formData.vatAmount ?? 0),
      Number(formData.total ?? 0),
      formData.origen ?? 'Manual',
    ]).catch((err) => console.error('[documentos] error al guardar en Sheet:', err));

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${tipo}-${numero}.pdf"`,
      },
    });
  } catch (err) {
    console.error('[documentos/generate] error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
