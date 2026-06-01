import axios from "axios";

export interface SlackMessage {
  ts: string; text: string; userId: string; username: string;
  channelId: string; channelName: string; threadTs?: string; replyCount?: number;
  reactions?: Array<{ name: string; count: number }>;
  attachments?: Array<{ title?: string; text?: string; color?: string }>;
  blocks?: unknown[]; isBot: boolean; botName?: string; formattedTime: string;
}

export interface SlackData {
  channelId: string; channelName: string; messages: SlackMessage[]; memberCount: number;
}

const SLACK_API_URL = "https://slack.com/api";
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || "";

const slackClient = axios.create({
  baseURL: SLACK_API_URL,
  headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}`, "Content-Type": "application/json" },
  timeout: 10000,
});

async function resolveUsernames(userIds: string[]): Promise<Record<string, string>> {
  const uniqueIds = [...new Set(userIds)].filter(Boolean);
  const usernameMap: Record<string, string> = {};
  await Promise.all(uniqueIds.map(async (userId) => {
    try {
      const response = await slackClient.get("/users.info", { params: { user: userId } });
      if (response.data.ok && response.data.user) {
        usernameMap[userId] = response.data.user.profile?.display_name || response.data.user.real_name || response.data.user.name || userId;
      }
    } catch { usernameMap[userId] = userId; }
  }));
  return usernameMap;
}

function formatSlackTimestamp(ts: string): string {
  return new Date(parseFloat(ts) * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
}

export async function fetchSlackData(channelId: string, limit = 20): Promise<SlackData> {
  const [channelInfoRes, historyResponse] = await Promise.all([
    slackClient.get("/conversations.info", { params: { channel: channelId } }),
    slackClient.get("/conversations.history", { params: { channel: channelId, limit, inclusive: true } }),
  ]);
  if (!historyResponse.data.ok) throw new Error(`Slack API error: ${historyResponse.data.error || "Unknown error"}`);
  const channelInfo = { name: channelInfoRes.data.channel?.name || channelId, memberCount: channelInfoRes.data.channel?.num_members || 0 };
  const rawMessages = historyResponse.data.messages || [];
  const userIds = rawMessages.filter((m: Record<string, unknown>) => m.user && typeof m.user === "string").map((m: Record<string, unknown>) => m.user as string);
  const usernameMap = await resolveUsernames(userIds);
  const messages: SlackMessage[] = rawMessages.map((msg: Record<string, unknown>) => {
    const userId = msg.user as string || "";
    return {
      ts: msg.ts as string, text: msg.text as string || "", userId,
      username: usernameMap[userId] || userId, channelId, channelName: channelInfo.name,
      threadTs: msg.thread_ts as string | undefined, replyCount: msg.reply_count as number | undefined,
      reactions: msg.reactions as SlackMessage["reactions"], attachments: msg.attachments as SlackMessage["attachments"],
      blocks: msg.blocks as unknown[] | undefined, isBot: !!(msg.bot_id || msg.subtype === "bot_message"),
      botName: msg.username as string | undefined, formattedTime: formatSlackTimestamp(msg.ts as string),
    };
  });
  return { channelId, channelName: channelInfo.name, messages, memberCount: channelInfo.memberCount };
}

export async function fetchSlackMultipleChannels(channelIds: string[]): Promise<SlackData[]> {
  const results = await Promise.allSettled(channelIds.map((id) => fetchSlackData(id, 10)));
  return results.filter((r): r is PromiseFulfilledResult<SlackData> => r.status === "fulfilled").map((r) => r.value);
}
