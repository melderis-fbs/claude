import { getComisionesAjustes } from '../../../../lib/sheets.js';

export const dynamic = 'force-dynamic';

// Solo lectura: los fijos/extras se cargan en la planilla "Comisiones ajustes".
export async function GET() {
  try {
    const ajustes = await getComisionesAjustes();
    return Response.json({ ajustes });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
