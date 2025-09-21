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
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Phone,
  Mail,
  RefreshCw,
  Download,
} from "lucide-react";

interface OperatorStats {
  overview: {
    active_clients: number;
    pending_cases: number;
    completed_today: number;
    avg_response_time: number;
    satisfaction_rate: number;
  };
  daily_activity: Array<{
    hour: string;
    requests: number;
    completed: number;
  }>;
  recent_cases: Array<{
    id: number;
    client_name: string;
    client_email: string;
    subject: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "URGENT";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    created_at: string;
    response_time?: number;
  }>;
  performance: {
    cases_handled_today: number;
    avg_resolution_time: number;
    client_satisfaction: number;
    response_rate: number;
  };
}

const statusLabels = {
  PENDING: "Oczekuje",
  IN_PROGRESS: "W trakcie",
  COMPLETED: "Zakończona",
  URGENT: "Pilne",
};

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  URGENT: "bg-red-100 text-red-800",
};

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export default function OperatorStatsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [stats, setStats] = useState<OperatorStats>({
    overview: {
      active_clients: 0,
      pending_cases: 0,
      completed_today: 0,
      avg_response_time: 0,
      satisfaction_rate: 0,
    },
    daily_activity: [],
    recent_cases: [],
    performance: {
      cases_handled_today: 0,
      avg_resolution_time: 0,
      client_satisfaction: 0,
      response_rate: 0,
    },
  });

  useEffect(() => {
    fetchStats();
  }, [selectedPeriod]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Mock data since backend not yet implemented
      const mockStats: OperatorStats = {
        overview: {
          active_clients: 47,
          pending_cases: 12,
          completed_today: 23,
          avg_response_time: 15,
          satisfaction_rate: 92.5,
        },
        daily_activity: [
          { hour: "09:00", requests: 8, completed: 6 },
          { hour: "10:00", requests: 12, completed: 10 },
          { hour: "11:00", requests: 15, completed: 13 },
          { hour: "12:00", requests: 10, completed: 9 },
          { hour: "13:00", requests: 6, completed: 5 },
          { hour: "14:00", requests: 11, completed: 11 },
          { hour: "15:00", requests: 9, completed: 8 },
          { hour: "16:00", requests: 7, completed: 7 },
        ],
        recent_cases: [
          {
            id: 1,
            client_name: "Jan Kowalski",
            client_email: "jan.kowalski@email.com",
            subject: "Pomoc w sporządzeniu pozwu",
            status: "URGENT",
            priority: "HIGH",
            created_at: "2024-01-22T10:30:00Z",
          },
          {
            id: 2,
            client_name: "Anna Nowak",
            client_email: "anna.nowak@email.com",
            subject: "Konsultacja prawna - prawo pracy",
            status: "IN_PROGRESS",
            priority: "MEDIUM",
            created_at: "2024-01-22T09:15:00Z",
            response_time: 12,
          },
          {
            id: 3,
            client_name: "Piotr Wiśniewski",
            client_email: "piotr.wisniewski@email.com",
            subject: "Analiza umowy najmu",
            status: "PENDING",
            priority: "LOW",
            created_at: "2024-01-22T08:45:00Z",
          },
          {
            id: 4,
            client_name: "Maria Wojcik",
            client_email: "maria.wojcik@email.com",
            subject: "Porada dotycząca spadku",
            status: "COMPLETED",
            priority: "MEDIUM",
            created_at: "2024-01-22T07:30:00Z",
            response_time: 8,
          },
        ],
        performance: {
          cases_handled_today: 23,
          avg_resolution_time: 18,
          client_satisfaction: 92.5,
          response_rate: 95.2,
        },
      };

      setStats(mockStats);
    } catch (error) {
      console.error("Error fetching operator stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Statystyki operatora</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(5)].map((_, i) => (
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
          <h1 className="text-3xl font-bold">Statystyki operatora</h1>
          <p className="text-muted-foreground">
            Twoja aktywność i wydajność obsługi klientów
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Dziś</SelectItem>
              <SelectItem value="week">Ten tydzień</SelectItem>
              <SelectItem value="month">Ten miesiąc</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Odśwież
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aktywni klienci
                </p>
                <p className="text-2xl font-bold">{stats.overview.active_clients}</p>
                <div className="text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +12% vs wczoraj
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
                  Oczekujące sprawy
                </p>
                <p className="text-2xl font-bold">{stats.overview.pending_cases}</p>
                <div className="text-xs text-muted-foreground">
                  Wymagają uwagi
                </div>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Zakończone dziś
                </p>
                <p className="text-2xl font-bold">{stats.overview.completed_today}</p>
                <div className="text-xs text-green-600">
                  Świetna robota!
                </div>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Średni czas odpowiedzi
                </p>
                <p className="text-2xl font-bold">{stats.overview.avg_response_time}min</p>
                <div className="text-xs text-green-600">
                  Poniżej celu (20min)
                </div>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Zadowolenie klientów
                </p>
                <p className="text-2xl font-bold">{stats.overview.satisfaction_rate}%</p>
                <div className="text-xs text-green-600">
                  Doskonały wynik
                </div>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Twoja wydajność</CardTitle>
            <CardDescription>
              Kluczowe metryki Twojej pracy dzisiaj
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Obsłużone sprawy</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.performance.cases_handled_today} / 30 (cel)
                  </span>
                </div>
                <Progress 
                  value={(stats.performance.cases_handled_today / 30) * 100} 
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Wskaźnik odpowiedzi</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.performance.response_rate}%
                  </span>
                </div>
                <Progress 
                  value={stats.performance.response_rate} 
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Zadowolenie klientów</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.performance.client_satisfaction}%
                  </span>
                </div>
                <Progress 
                  value={stats.performance.client_satisfaction} 
                  className="h-2"
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Średni czas rozwiązania</span>
                  <span className="text-lg font-bold text-green-600">
                    {stats.performance.avg_resolution_time} min
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cel: poniżej 25 minut
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Aktywność dzienna</CardTitle>
            <CardDescription>
              Liczba zapytań i ukończonych spraw w ciągu dnia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.daily_activity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{activity.hour}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">
                        {activity.requests} zapytań
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">
                        {activity.completed} zakończonych
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Najnowsze sprawy</CardTitle>
          <CardDescription>
            Sprawy wymagające Twojej uwagi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Klient</TableHead>
                <TableHead>Temat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priorytet</TableHead>
                <TableHead>Czas odpowiedzi</TableHead>
                <TableHead>Data utworzenia</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recent_cases.map((case_item) => (
                <TableRow key={case_item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{case_item.client_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {case_item.client_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate">
                      {case_item.subject}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[case_item.status]}>
                      {statusLabels[case_item.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={priorityColors[case_item.priority]}
                    >
                      {case_item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {case_item.response_time ? (
                      <span className="text-sm">{case_item.response_time} min</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(case_item.created_at).toLocaleDateString("pl-PL")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}