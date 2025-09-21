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
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  DollarSign,
  FileText,
  Clock,
  Download,
  RefreshCw,
  Calendar,
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
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    overview: {
      total_users: 0,
      active_users: 0,
      total_revenue: 0,
      total_cases: 0,
      api_calls_today: 0,
      growth_rate: 0,
    },
    user_analytics: {
      new_registrations: [],
      user_activity: [],
      retention_rate: 0,
    },
    financial_analytics: {
      revenue_by_month: [],
      subscription_distribution: [],
      churn_rate: 0,
    },
    system_analytics: {
      api_usage: [],
      error_rate: 0,
      uptime: 0,
    },
  });

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock analytics data since backend not yet implemented
      const mockAnalytics: AnalyticsData = {
        overview: {
          total_users: 125,
          active_users: 89,
          total_revenue: 12450,
          total_cases: 234,
          api_calls_today: 1456,
          growth_rate: 15.2,
        },
        user_analytics: {
          new_registrations: [
            { date: "2024-01-01", count: 12 },
            { date: "2024-01-02", count: 18 },
            { date: "2024-01-03", count: 15 },
            { date: "2024-01-04", count: 22 },
            { date: "2024-01-05", count: 19 },
          ],
          user_activity: [
            { date: "2024-01-01", active_users: 65 },
            { date: "2024-01-02", active_users: 72 },
            { date: "2024-01-03", active_users: 89 },
            { date: "2024-01-04", active_users: 94 },
            { date: "2024-01-05", active_users: 89 },
          ],
          retention_rate: 85.5,
        },
        financial_analytics: {
          revenue_by_month: [
            { month: "Grudzień", revenue: 8500 },
            { month: "Styczeń", revenue: 12450 },
          ],
          subscription_distribution: [
            { plan: "Basic", count: 45, percentage: 36 },
            { plan: "Pro", count: 68, percentage: 54 },
            { plan: "Enterprise", count: 12, percentage: 10 },
          ],
          churn_rate: 4.2,
        },
        system_analytics: {
          api_usage: [
            { endpoint: "/api/v1/cases", calls: 2340, avg_response_time: 145 },
            { endpoint: "/api/v1/documents", calls: 1890, avg_response_time: 230 },
            { endpoint: "/api/v1/auth", calls: 567, avg_response_time: 89 },
            { endpoint: "/api/v1/analysis", calls: 456, avg_response_time: 1240 },
          ],
          error_rate: 0.8,
          uptime: 99.9,
        },
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analityka</h1>
          <p className="text-muted-foreground">
            Szczegółowe raporty i statystyki systemu
          </p>
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
              <SelectItem value="1y">1 rok</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Odśwież
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Eksportuj
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Użytkownicy
                </p>
                <p className="text-2xl font-bold">{analytics.overview.total_users}</p>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{analytics.overview.growth_rate}%
                </div>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aktywni użytkownicy
                </p>
                <p className="text-2xl font-bold">{analytics.overview.active_users}</p>
                <div className="text-xs text-muted-foreground">
                  {Math.round((analytics.overview.active_users / analytics.overview.total_users) * 100)}% wszystkich
                </div>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Przychody
                </p>
                <p className="text-2xl font-bold">{analytics.overview.total_revenue.toLocaleString()} PLN</p>
                <div className="text-xs text-muted-foreground">
                  Ten miesiąc
                </div>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Sprawy
                </p>
                <p className="text-2xl font-bold">{analytics.overview.total_cases}</p>
                <div className="text-xs text-muted-foreground">
                  Wszystkie
                </div>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Wywołania API
                </p>
                <p className="text-2xl font-bold">{analytics.overview.api_calls_today.toLocaleString()}</p>
                <div className="text-xs text-muted-foreground">
                  Dziś
                </div>
              </div>
              <div className="h-8 w-8 bg-cyan-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Uptime
                </p>
                <p className="text-2xl font-bold">{analytics.system_analytics.uptime}%</p>
                <div className="text-xs text-green-600">
                  Excellent
                </div>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Użytkownicy</TabsTrigger>
          <TabsTrigger value="financial">Finanse</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Retencja użytkowników</CardTitle>
                <CardDescription>
                  Odsetek użytkowników, którzy wracają po pierwszym logowaniu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Retencja 30-dniowa</span>
                    <span className="text-2xl font-bold">{analytics.user_analytics.retention_rate}%</span>
                  </div>
                  <Progress value={analytics.user_analytics.retention_rate} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {analytics.user_analytics.retention_rate > 80 ? "Bardzo dobry" : 
                     analytics.user_analytics.retention_rate > 60 ? "Dobry" : "Wymaga poprawy"} poziom retencji
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nowe rejestracje</CardTitle>
                <CardDescription>
                  Liczba nowych użytkowników w ostatnich dniach
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Rejestracje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.user_analytics.new_registrations.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(item.date).toLocaleDateString("pl-PL")}
                        </TableCell>
                        <TableCell className="text-right">{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Przychody miesięczne</CardTitle>
                <CardDescription>
                  Trend przychodów w ostatnich miesiącach
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Miesiąc</TableHead>
                      <TableHead className="text-right">Przychód</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.financial_analytics.revenue_by_month.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.month}</TableCell>
                        <TableCell className="text-right">
                          {item.revenue.toLocaleString()} PLN
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rozkład subskrypcji</CardTitle>
                <CardDescription>
                  Popularność planów subskrypcyjnych
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.financial_analytics.subscription_distribution.map((plan) => (
                    <div key={plan.plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{plan.plan}</Badge>
                        <span className="text-sm">{plan.count} użytkowników</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={plan.percentage} className="w-20 h-2" />
                        <span className="text-sm font-medium w-10">{plan.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span>Churn rate</span>
                    <span className={`font-medium ${analytics.financial_analytics.churn_rate < 5 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.financial_analytics.churn_rate}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Statystyki API</CardTitle>
                <CardDescription>
                  Najpopularniejsze endpointy i ich wydajność
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead className="text-right">Wywołania</TableHead>
                      <TableHead className="text-right">Avg. czas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.system_analytics.api_usage.map((endpoint, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">
                          {endpoint.endpoint}
                        </TableCell>
                        <TableCell className="text-right">
                          {endpoint.calls.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={endpoint.avg_response_time > 1000 ? "destructive" : "secondary"}>
                            {endpoint.avg_response_time}ms
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wydajność systemu</CardTitle>
                <CardDescription>
                  Kluczowe metryki systemowe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-2xl font-bold text-green-600">
                      {analytics.system_analytics.uptime}%
                    </span>
                  </div>
                  <Progress value={analytics.system_analytics.uptime} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Error Rate</span>
                    <span className={`text-2xl font-bold ${analytics.system_analytics.error_rate < 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {analytics.system_analytics.error_rate}%
                    </span>
                  </div>
                  <Progress 
                    value={analytics.system_analytics.error_rate} 
                    className="h-2"
                  />
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      System działa stabilnie. Wszystkie metryki w normie.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}