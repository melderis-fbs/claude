export const dynamic = 'force-dynamic';

export async function GET(request) {
  const token     = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;

  if (!token || !accountId) {
    return Response.json({ spend: null, configured: false });
  }

  const { searchParams } = new URL(request.url);
  const mes = searchParams.get('mes') || '';

  let since, until;
  if (/^\d{4}-\d{2}$/.test(mes)) {
    const [year, month] = mes.split('-');
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    since = `${year}-${month}-01`;
    until = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  } else {
    const now = new Date();
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const d  = String(now.getDate()).padStart(2, '0');
    since = `${y}-${mo}-01`;
    until = `${y}-${mo}-${d}`;
  }

  try {
    const params = new URLSearchParams({
      fields:       'spend',
      time_range:   JSON.stringify({ since, until }),
      access_token: token,
    });
    const url = `https://graph.facebook.com/v19.0/act_${accountId}/insights?${params}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      const text = await res.text();
      console.error('[meta/spend] API error:', text);
      return Response.json({ spend: null, configured: true, error: `Meta API ${res.status}` });
    }

    const data = await res.json();
    if (data.error) {
      console.error('[meta/spend] Meta error:', data.error);
      return Response.json({ spend: null, configured: true, error: data.error.message });
    }

    const spend = data.data?.[0]?.spend != null ? parseFloat(data.data[0].spend) : 0;
    return Response.json({ spend, configured: true });
  } catch (err) {
    console.error('[meta/spend] error:', err);
    return Response.json({ spend: null, configured: true, error: err.message });
  }
}
