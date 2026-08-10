import path from 'path';
import fs from 'fs';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import InformeDocument from '../../../../components/pdf/InformeDocument.jsx';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getAssetPath(filename) {
  const p = path.join(process.cwd(), 'public', filename);
  return fs.existsSync(p) ? p : null;
}

// POST — el cliente envía los datos YA calculados que están en pantalla
// (resumen, cobranzas, anuncio del mes, pendientes) y acá sólo renderizamos el
// PDF. Así no volvemos a pegarle a la planilla y el informe refleja exactamente
// lo que se ve en el dashboard.
export async function POST(request) {
  try {
    const data = await request.json();
    if (!data?.m) return Response.json({ error: 'Faltan datos del mes' }, { status: 400 });

    const logoSrc = getAssetPath('founders-logo.png');
    const buffer = await renderToBuffer(
      React.createElement(InformeDocument, { data, logoSrc })
    );
    const nombre = `Informe-FoundersBS-${(data.label || 'mes').replace(/\s+/g, '-')}.pdf`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nombre}"`,
      },
    });
  } catch (err) {
    console.error('[informe/generate] error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
