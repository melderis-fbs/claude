import axios from "axios";

export interface MetaCampaign {
  id: string; name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED";
  objective: string; spend: number; impressions: number; clicks: number;
  leads: number; purchases: number; purchaseValue: number;
  ctr: number; cpc: number; cpl: number; roas: number; reach: number; frequency: number;
}

export interface MetaInsights {
  spend: number; impressions: number; clicks: number; reach: number; frequency: number;
  ctr: number; cpc: number; cpm: number; leads: number; cpl: number;
  purchases: number; purchaseValue: number; roas: number; dateStart: string; dateStop: string;
}

export interface MetaMetrics {
  accountName: string; accountId: string; currency: string;
  todayInsights: MetaInsights; last7DaysInsights: MetaInsights; last30DaysInsights: MetaInsights;
  activeCampaigns: MetaCampaign[]; topCampaigns: MetaCampaign[];
}

const META_GRAPH_URL = "https://graph.facebook.com/v19.0";
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";
const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID || "";

const metaClient = axios.create({ baseURL: META_GRAPH_URL, timeout: 15000 });

const DEFAULT_INSIGHT_FIELDS = "spend,impressions,clicks,reach,frequency,ctr,cpc,cpm,actions,action_values,cost_per_action_type";

function extractActionValue(actions: Array<{ action_type: string; value: string }> | undefined, actionType: string): number {
  if (!actions) return 0;
  const action = actions.find((a) => a.action_type === actionType);
  return action ? parseFloat(action.value) : 0;
}

function buildInsightsFromResponse(data: Record<string, unknown>): MetaInsights {
  const actions = data.actions as Array<{ action_type: string; value: string }> | undefined;
  const actionValues = data.action_values as Array<{ action_type: string; value: string }> | undefined;
  const leads = extractActionValue(actions, "lead") || extractActionValue(actions, "onsite_conversion.lead_grouped");
  const purchases = extractActionValue(actions, "purchase");
  const purchaseValue = extractActionValue(actionValues, "purchase");
  const spend = parseFloat((data.spend as string) || "0");
  return {
    spend, impressions: parseInt((data.impressions as string) || "0"),
    clicks: parseInt((data.clicks as string) || "0"), reach: parseInt((data.reach as string) || "0"),
    frequency: parseFloat((data.frequency as string) || "0"), ctr: parseFloat((data.ctr as string) || "0"),
    cpc: parseFloat((data.cpc as string) || "0"), cpm: parseFloat((data.cpm as string) || "0"),
    leads, cpl: leads > 0 ? spend / leads : 0, purchases, purchaseValue,
    roas: spend > 0 ? purchaseValue / spend : 0,
    dateStart: data.date_start as string, dateStop: data.date_stop as string,
  };
}

async function fetchAccountInsights(datePreset: string): Promise<MetaInsights> {
  const response = await metaClient.get(`/act_${META_AD_ACCOUNT_ID}/insights`, {
    params: { access_token: META_ACCESS_TOKEN, fields: DEFAULT_INSIGHT_FIELDS, date_preset: datePreset, level: "account" },
  });
  return buildInsightsFromResponse(response.data.data?.[0] || {});
}

async function fetchCampaigns(): Promise<MetaCampaign[]> {
  const response = await metaClient.get(`/act_${META_AD_ACCOUNT_ID}/campaigns`, {
    params: { access_token: META_ACCESS_TOKEN, fields: "id,name,status,objective", effective_status: '["ACTIVE","PAUSED"]', limit: 50 },
  });
  const campaigns: MetaCampaign[] = [];
  for (const campaign of response.data.data || []) {
    const insightsRes = await metaClient.get(`/${campaign.id}/insights`, {
      params: { access_token: META_ACCESS_TOKEN, fields: DEFAULT_INSIGHT_FIELDS, date_preset: "last_30d" },
    });
    const insights = buildInsightsFromResponse(insightsRes.data.data?.[0] || {});
    campaigns.push({ id: campaign.id, name: campaign.name, status: campaign.status, objective: campaign.objective, ...insights });
  }
  return campaigns;
}

async function fetchAccountInfo(): Promise<{ name: string; currency: string }> {
  const response = await metaClient.get(`/act_${META_AD_ACCOUNT_ID}`, {
    params: { access_token: META_ACCESS_TOKEN, fields: "name,currency" },
  });
  return { name: response.data.name || "Ad Account", currency: response.data.currency || "USD" };
}

export async function fetchMetaData(): Promise<MetaMetrics> {
  const [accountInfo, todayInsights, last7DaysInsights, last30DaysInsights, campaigns] = await Promise.all([
    fetchAccountInfo(), fetchAccountInsights("today"), fetchAccountInsights("last_7d"), fetchAccountInsights("last_30d"), fetchCampaigns(),
  ]);
  return {
    accountName: accountInfo.name, accountId: META_AD_ACCOUNT_ID, currency: accountInfo.currency,
    todayInsights, last7DaysInsights, last30DaysInsights,
    activeCampaigns: campaigns.filter((c) => c.status === "ACTIVE"),
    topCampaigns: [...campaigns].sort((a, b) => b.leads - a.leads).slice(0, 5),
  };
}
