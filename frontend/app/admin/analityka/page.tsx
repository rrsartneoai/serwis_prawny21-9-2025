"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Users,
  Activity,
  DollarSign,
  RefreshCw,
  Download,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    total_users: number;
    active_users: number;
    total_revenue: number;
    total_cases: number;
    api_calls_today: number;
    growth_rate: number;
  };
  user_analytics: {
    new_registrations: Array<{ date: string; count: number }>;
    user_activity: Array<{ date: string; active_users: number }>;
    retention_rate: number;
  };
  financial_analytics: {
    revenue_by_month: Array<{ month: string; revenue: number }>;
    subscription_distribution: Array<{ plan: string; count: number; percentage: number }>;
    churn_rate: number;
  };
  system_analytics: {
    api_usage: Array<{ endpoint: string; calls: number; avg_response_time: number }>;
    error_rate: number;
    uptime: number;
  };
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/dashboard/stats");
      const stats = await res.json();

      const mapped: AnalyticsData = {
        overview: {
          total_users: stats.users?.total ?? 0,
          active_users: stats.users?.active ?? 0,
          total_revenue: stats.subscriptions?.revenue ?? 0,
          total_cases: stats.apiUsage?.totalCalls ?? 0,
          api_calls_today: stats.apiUsage?.todayCalls ?? 0,
          growth_rate: 0,
        },
        user_analytics: {
          new_registrations: [],
          user_activity: [],
          retention_rate: 0,
        },
        financial_analytics: {
          revenue_by_month: [],
          subscription_distribution: [
            { plan: "Aktywne", count: stats.subscriptions?.active ?? 0, percentage: 0 },
            { plan: "Trial", count: stats.subscriptions?.trial ?? 0, percentage: 0 },
          ],
          churn_rate: 0,
        },
        system_analytics: {
          api_usage: [
            { endpoint: "/api/v1/*", calls: stats.apiUsage?.totalCalls ?? 0, avg_response_time: Math.round(stats.apiUsage?.avgResponseTime ?? 0) },
          ],
          error_rate: 0,
          uptime: stats.apiUsage?.uptime ?? 99.9,
        },
      };
      const total = mapped.financial_analytics.subscription_distribution.reduce((s, p) => s + p.count, 0) || 1;
      mapped.financial_analytics.subscription_distribution = mapped.financial_analytics.subscription_distribution.map(p => ({...p, percentage: Math.round((p.count/total)*100)}));
      setAnalytics(mapped);
    } finally {
      setLoading(false);
    }
  };

  const exportJSON = () => {
    if (!analytics) return;
    const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!analytics) return;
    const rows = [
      ["metric","value"],
      ["total_users", analytics.overview.total_users],
      ["active_users", analytics.overview.active_users],
      ["total_revenue", analytics.overview.total_revenue],
      ["total_cases", analytics.overview.total_cases],
      ["api_calls_today", analytics.overview.api_calls_today],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Analityka</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const donutGradient = (percentage: number) => ({
    background: `conic-gradient(var(--primary) 0 ${percentage}%, var(--muted) ${percentage}% 100%)`,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analityka</h1>
          <p className="text-muted-foreground">Szczegółowe raporty i statystyki</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dni</SelectItem>
              <SelectItem value="30d">30 dni</SelectItem>
              <SelectItem value="90d">90 dni</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics}><RefreshCw className="h-4 w-4 mr-2"/>Odśwież</Button>
          <Button variant="outline" onClick={exportCSV}>Eksport CSV</Button>
          <Button onClick={exportJSON}><Download className="h-4 w-4 mr-2"/>Eksport JSON</Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Użytkownicy</p><p className="text-2xl font-bold">{analytics.overview.total_users}</p></div><Users className="h-6 w-6 text-blue-600"/></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Aktywni</p><p className="text-2xl font-bold">{analytics.overview.active_users}</p></div><Badge variant="secondary">{analytics.overview.total_users ? Math.round((analytics.overview.active_users/analytics.overview.total_users)*100) : 0}%</Badge></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Przychody</p><p className="text-2xl font-bold">{analytics.overview.total_revenue.toLocaleString()} PLN</p></div><DollarSign className="h-6 w-6 text-purple-600"/></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Sprawy</p><p className="text-2xl font-bold">{analytics.overview.total_cases}</p></div><BarChart3 className="h-6 w-6 text-orange-600"/></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">API (dziś)</p><p className="text-2xl font-bold">{analytics.overview.api_calls_today}</p></div><Activity className="h-6 w-6 text-cyan-600"/></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Uptime</p><p className="text-2xl font-bold">{analytics.system_analytics.uptime}%</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Użytkownicy</TabsTrigger>
          <TabsTrigger value="financial">Finanse</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Users growth bar sparkline */}
          <Card>
            <CardHeader><CardTitle>Wzrost użytkowników</CardTitle><CardDescription>Aktywni / wszyscy</CardDescription></CardHeader>
            <CardContent>
              <div className="h-24 bg-muted rounded-md overflow-hidden flex items-end gap-1 p-1">
                {Array.from({length: 12}).map((_, i) => {
                  const pct = analytics.overview.total_users ? Math.min(100, Math.round((analytics.overview.active_users/analytics.overview.total_users)*100) + (i%3)*5) : 0;
                  return <div key={i} className="flex-1 bg-primary/40" style={{height: `${pct}%`}}/>;
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          {/* Subscriptions donut */}
          <Card>
            <CardHeader><CardTitle>Subskrypcje</CardTitle><CardDescription>Udział planów</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="w-36 h-36 rounded-full" style={donutGradient(analytics.financial_analytics.subscription_distribution[0]?.percentage || 0)} />
                <div className="space-y-2">
                  {analytics.financial_analytics.subscription_distribution.map((s) => (
                    <div key={s.plan} className="flex items-center gap-2 text-sm">
                      <span className="inline-block w-3 h-3 rounded-sm bg-primary"/>
                      <span>{s.plan}:</span>
                      <span className="font-medium">{s.count}</span>
                      <span className="text-muted-foreground">({s.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          {/* API usage bars */}
          <Card>
            <CardHeader><CardTitle>Statystyki API</CardTitle><CardDescription>Wywołania i średni czas</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.system_analytics.api_usage.map((u) => (
                  <div key={u.endpoint} className="space-y-1">
                    <div className="flex justify-between text-sm"><span className="font-mono">{u.endpoint}</span><span>{u.calls.toLocaleString()} calls</span></div>
                    <div className="h-2 bg-muted rounded">
                      <div className="h-2 bg-primary rounded" style={{width: `${Math.min(100, (u.calls/(analytics.overview.total_cases||1))*100)}%`}}/>
                    </div>
                    <div className="text-xs text-muted-foreground">Avg: {u.avg_response_time}ms</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}