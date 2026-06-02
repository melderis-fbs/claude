import { getComentariosData, postComentario } from '../../../lib/sheets.js';

export async function GET() {
  const data = await getComentariosData();
  return Response.json({ data });
}

export async function POST(request) {
  const { tipo, nombre, texto } = await request.json();
  const result = await postComentario(tipo, nombre, texto);
  return Response.json(result);
}
