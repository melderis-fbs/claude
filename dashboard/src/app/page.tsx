"use client";

import { useState } from "react";
import { format } from "date-fns";
import { RefreshCw, LayoutDashboard, TrendingUp, Users, FileSpreadsheet, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import MetaStats from "@/components/MetaStats";
import GHLStats from "@/components/GHLStats";
import SlackActivity from "@/components/SlackActivity";
import SheetsData from "@/components/SheetsData";

export default function DashboardPage() {
  const [lastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
    } catch {
      // mock mode
    } finally {
      setTimeout(() => setIsRefreshing(false), 1200);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">Business Dashboard</h1>
              <p className="text-xs text-muted-foreground">GHL · Meta Ads · Slack · Google Sheets</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Last updated</p>
              <p className="text-sm font-medium text-foreground">{format(lastUpdated, "MMM d, yyyy HH:mm")}</p>
            </div>
            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10 hidden sm:flex">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              Live
            </Badge>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border border-border h-11">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <LayoutDashboard className="w-4 h-4" />Overview
            </TabsTrigger>
            <TabsTrigger value="meta" className="flex items-center gap-2 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400">
              <TrendingUp className="w-4 h-4" />Meta Ads
            </TabsTrigger>
            <TabsTrigger value="ghl" className="flex items-center gap-2 data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-400">
              <Users className="w-4 h-4" />GHL
            </TabsTrigger>
            <TabsTrigger value="sheets" className="flex items-center gap-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />Sheets
            </TabsTrigger>
            <TabsTrigger value="slack" className="flex items-center gap-2 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
              <MessageSquare className="w-4 h-4" />Slack
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MetaStats detailed={false} />
              <GHLStats detailed={false} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SheetsData detailed={false} />
              <SlackActivity detailed={false} />
            </div>
          </TabsContent>
          <TabsContent value="meta"><MetaStats detailed={true} /></TabsContent>
          <TabsContent value="ghl"><GHLStats detailed={true} /></TabsContent>
          <TabsContent value="sheets"><SheetsData detailed={true} /></TabsContent>
          <TabsContent value="slack"><SlackActivity detailed={true} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
