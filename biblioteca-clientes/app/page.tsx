import { getAllClients } from '@/lib/notion';
import ClientLibrary from '@/components/ClientLibrary';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let clients: any[] = [];
  try {
    clients = await getAllClients();
  } catch (e) {
    console.error('Notion API error:', e);
  }
  return <ClientLibrary initial={clients} />;
}
