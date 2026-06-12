import { Client as NotionClient } from '@notionhq/client';
import type { Client } from '@/types/client';

const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });
const DB = process.env.NOTION_DATABASE_ID!;

const rt = (p: any): string => p?.rich_text?.[0]?.plain_text ?? '';
const getUrl = (p: any): string => p?.url ?? '';
const sel = (p: any): string => p?.select?.name ?? '';
const chk = (p: any): boolean => p?.checkbox ?? false;
const ttl = (p: any): string => p?.title?.[0]?.plain_text ?? '';
const em = (p: any): string => p?.email ?? '';

function toClient(page: any): Client {
  const pr = page.properties;
  return {
    id: page.id,
    n: ttl(pr['Nombre']),
    p: rt(pr['Profesión']),
    g: rt(pr['Negocio']),
    c: rt(pr['A quién ayuda']),
    cat: sel(pr['Nicho']),
    u: getUrl(pr['Instagram']),
    email: em(pr['Email']),
    x: chk(pr['Caso de éxito']),
    t: getUrl(pr['Testimonio']),
  };
}

function buildProps(data: Partial<Omit<Client, 'id'>>) {
  const p: any = {};
  if (data.n !== undefined) p['Nombre'] = { title: [{ text: { content: data.n } }] };
  if (data.p !== undefined) p['Profesión'] = { rich_text: [{ text: { content: data.p } }] };
  if (data.g !== undefined) p['Negocio'] = { rich_text: [{ text: { content: data.g } }] };
  if (data.c !== undefined) p['A quién ayuda'] = { rich_text: [{ text: { content: data.c } }] };
  if (data.cat !== undefined) p['Nicho'] = data.cat ? { select: { name: data.cat } } : { select: null };
  if (data.u !== undefined) p['Instagram'] = data.u ? { url: data.u } : { url: null };
  if (data.email !== undefined) p['Email'] = data.email ? { email: data.email } : { email: null };
  if (data.x !== undefined) p['Caso de éxito'] = { checkbox: data.x };
  if (data.t !== undefined) p['Testimonio'] = data.t ? { url: data.t } : { url: null };
  return p;
}

export async function getAllClients(): Promise<Client[]> {
  const pages: any[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: DB,
      sorts: [{ property: 'Nombre', direction: 'ascending' }],
      start_cursor: cursor,
    });
    pages.push(...res.results);
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return pages.map(toClient);
}

export async function createClient(data: Omit<Client, 'id'>): Promise<Client> {
  const res = await notion.pages.create({
    parent: { database_id: DB },
    properties: buildProps(data),
  }) as any;
  return toClient(res);
}

export async function updateClient(id: string, data: Partial<Omit<Client, 'id'>>): Promise<void> {
  await notion.pages.update({ page_id: id, properties: buildProps(data) });
}

export async function deleteClient(id: string): Promise<void> {
  await notion.pages.update({ page_id: id, archived: true });
}
