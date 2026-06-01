import axios from "axios";

export interface GHLContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags: string[];
  dateAdded: string;
  source: string;
}

export interface GHLOpportunity {
  id: string;
  name: string;
  monetaryValue: number;
  status: "open" | "won" | "lost" | "abandoned";
  stageId: string;
  stageName: string;
  contactId: string;
  contactName: string;
  createdAt: string;
  updatedAt: string;
}

export interface GHLAppointment {
  id: string;
  title: string;
  contactId: string;
  contactName: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "showed" | "noshow" | "cancelled";
  calendarId: string;
}

export interface GHLMetrics {
  contacts: {
    total: number;
    newThisMonth: number;
    newThisWeek: number;
  };
  pipeline: {
    totalValue: number;
    openOpportunities: number;
    wonThisMonth: number;
    wonValue: number;
    lostThisMonth: number;
  };
  appointments: {
    total: number;
    confirmed: number;
    showed: number;
    noShow: number;
    showRate: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growthPercent: number;
  };
  recentOpportunities: GHLOpportunity[];
  recentContacts: GHLContact[];
}

const GHL_BASE_URL = process.env.GHL_BASE_URL || "https://rest.gohighlevel.com/v1";
const GHL_API_KEY = process.env.GHL_API_KEY || "";

const ghlClient = axios.create({
  baseURL: GHL_BASE_URL,
  headers: {
    Authorization: `Bearer ${GHL_API_KEY}`,
    "Content-Type": "application/json",
    Version: "2021-07-28",
  },
  timeout: 15000,
});

async function fetchContacts(): Promise<GHLContact[]> {
  const response = await ghlClient.get("/contacts/", {
    params: { limit: 100, sortBy: "date_added", sortOrder: "desc" },
  });
  return response.data.contacts || [];
}

async function fetchOpportunities(): Promise<GHLOpportunity[]> {
  const response = await ghlClient.get("/pipelines/opportunities/search", {
    params: { limit: 100, sortBy: "created_at", sortOrder: "desc" },
  });
  return response.data.opportunities || [];
}

async function fetchAppointments(): Promise<GHLAppointment[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  const response = await ghlClient.get("/appointments/", {
    params: { startTime: startOfMonth, endTime: endOfMonth, limit: 200 },
  });
  return response.data.appointments || [];
}

export async function fetchGHLData(): Promise<GHLMetrics> {
  const [contacts, opportunities, appointments] = await Promise.all([
    fetchContacts(), fetchOpportunities(), fetchAppointments(),
  ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const newThisMonth = contacts.filter((c) => new Date(c.dateAdded) >= startOfMonth).length;
  const newThisWeek = contacts.filter((c) => new Date(c.dateAdded) >= startOfWeek).length;
  const openOpps = opportunities.filter((o) => o.status === "open");
  const wonThisMonth = opportunities.filter((o) => o.status === "won" && new Date(o.updatedAt) >= startOfMonth);
  const lostThisMonth = opportunities.filter((o) => o.status === "lost" && new Date(o.updatedAt) >= startOfMonth).length;
  const totalPipelineValue = openOpps.reduce((sum, o) => sum + (o.monetaryValue || 0), 0);
  const wonValue = wonThisMonth.reduce((sum, o) => sum + (o.monetaryValue || 0), 0);
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const showed = appointments.filter((a) => a.status === "showed").length;
  const noShow = appointments.filter((a) => a.status === "noshow").length;
  const showRate = showed + noShow > 0 ? (showed / (showed + noShow)) * 100 : 0;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthRevenue = opportunities
    .filter((o) => o.status === "won" && new Date(o.updatedAt) >= lastMonth && new Date(o.updatedAt) <= endOfLastMonth)
    .reduce((sum, o) => sum + (o.monetaryValue || 0), 0);
  const growthPercent = lastMonthRevenue > 0 ? ((wonValue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  return {
    contacts: { total: contacts.length, newThisMonth, newThisWeek },
    pipeline: { totalValue: totalPipelineValue, openOpportunities: openOpps.length, wonThisMonth: wonThisMonth.length, wonValue, lostThisMonth },
    appointments: { total: appointments.length, confirmed, showed, noShow, showRate: Math.round(showRate * 10) / 10 },
    revenue: { thisMonth: wonValue, lastMonth: lastMonthRevenue, growthPercent: Math.round(growthPercent * 10) / 10 },
    recentOpportunities: opportunities.slice(0, 5),
    recentContacts: contacts.slice(0, 5),
  };
}
