"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { operatorAPI, OperatorCase } from "@/lib/api/operator";
import { toast } from "@/components/ui/use-toast";
import {
  FileText,
  Filter,
  User,
  Settings,
  BarChart3,
  Users,
  MessageSquare,
  CheckCircle2,
  Clock4,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  caseId: string;
  client: string; // Changed from clientName for consistency
  type: string;
  title: string;
  priority: "high" | "medium" | "low";
  deadline: Date;
  status: "pending" | "in_progress" | "completed";
  documents: number; // Changed from string[] to number (count)
  package: string;
  description: string;
}

export default function PanelOperatoraPage() {
  /* ---------------------------------------------------------------------- */
  /*                              AUTH MOCKING                              */
  /* ---------------------------------------------------------------------- */
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "zadania" | "statystyki" | "klienci" | "szablony" | "ustawienia"
  >("zadania");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cases, setCases] = useState<OperatorCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  // Redirect if not authenticated or not operator
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/logowanie');
    } else if (user?.role !== 'operator') {
      router.push('/'); // Redirect non-operators
    }
  }, [isAuthenticated, user, router]);

  // Load real cases from API
  useEffect(() => {
    if (isAuthenticated && user?.role === 'operator') {
      loadCases();
    }
  }, [isAuthenticated, user]);

  const loadCases = async () => {
    setLoading(true);
    const { cases: operatorCases, error } = await operatorAPI.getCases();
    
    if (error) {
      toast({
        title: "Błąd",
        description: error,
        variant: "destructive",
      });
    } else if (operatorCases) {
      setCases(operatorCases);
    }
    setLoading(false);
  };

  const transformCaseToTask = (operatorCase: OperatorCase): Task => {
    const statusMap: Record<string, Task['status']> = {
      'paid': 'pending',
      'processing': 'in_progress',
      'analysis_ready': 'completed',
      'documents_ready': 'completed',
      'completed': 'completed'
    };
    
    const priorityMap: Record<string, Task['priority']> = {
      'basic': 'low',
      'standard': 'medium',
      'premium': 'high'
    };

    return {
      id: operatorCase.id.toString(),
      caseId: operatorCase.id.toString(),
      title: operatorCase.title,
      client: operatorCase.client_name || operatorCase.client_email || 'Nieznany klient',
      status: statusMap[operatorCase.status] || 'pending',
      priority: priorityMap[operatorCase.package_type || 'standard'] || 'medium',
      deadline: operatorCase.deadline ? new Date(operatorCase.deadline) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      documents: operatorCase.documents.length,
      package: operatorCase.package_type || 'standard',
      type: 'analysis',
      description: operatorCase.description || operatorCase.client_notes || ''
    };
  };

  // Transform real cases to tasks for UI compatibility
  const currentTasks = cases.map(transformCaseToTask);

  const sidebarItems = [
    { id: "zadania", label: "Zadania do wykonania", icon: FileText },
    { id: "statystyki", label: "Statystyki", icon: BarChart3 },
    { id: "klienci", label: "Klienci", icon: Users },
    { id: "szablony", label: "Szablony odpowiedzi", icon: MessageSquare },
    { id: "ustawienia", label: "Ustawienia", icon: Settings },
  ] as const;

  /* ---------------------------------------------------------------------- */
  /*                                HELPERS                                 */
  /* ---------------------------------------------------------------------- */
  const getPriorityBadge = (priority: Task["priority"]) => {
    const map = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };
    return map[priority];
  };

  const getStatusBadge = (status: Task["status"]) => {
    const map = {
      pending: {
        label: "Oczekuje",
        color: "bg-blue-100 text-blue-800",
        icon: Clock4,
      },
      in_progress: {
        label: "W trakcie",
        color: "bg-yellow-100 text-yellow-800",
        icon: AlertCircle,
      },
      completed: {
        label: "Zakończone",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle2,
      },
    };
    return map[status];
  };

  /* ---------------------------------------------------------------------- */
  /*                                   UI                                   */
  /* ---------------------------------------------------------------------- */
  if (!isAuthenticated) {
    return <div className="p-10 text-center">Ładowanie...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header />
      <div className="flex flex-1">
        {/* ----------------------------- SIDEBAR ---------------------------- */}
        <aside
          className={`bg-white shadow-lg transition-all duration-300 ${sidebarOpen ? "w-64" : "w-64 hidden lg:block"}`}
        >
          <div className="p-6 h-full flex flex-col">
            {/* operator info */}
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{user?.name ?? "Operator"}</p>
                <p className="text-xs text-gray-500">Panel operatora</p>
              </div>
            </div>

            {/* nav */}
            <nav className="space-y-2 flex-1">
              {sidebarItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as typeof activeTab)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* -------------------------- MAIN CONTENT -------------------------- */}
        <main className="flex-1 p-6">
          {activeTab === "zadania" && (
            <>
              {/* header row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Zadania do wykonania
                </h1>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtruj
                  </Button>
                  <Button size="sm" onClick={loadCases} disabled={loading}>
                    {loading ? "Ładowanie..." : "Odśwież"}
                  </Button>
                </div>
              </div>

              {/* simple stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                  title="Oczekujące"
                  value={currentTasks.filter((t) => t.status === "pending").length}
                  color="bg-blue-100 text-blue-800"
                />
                <StatCard
                  title="W trakcie"
                  value={
                    currentTasks.filter((t) => t.status === "in_progress").length
                  }
                  color="bg-yellow-100 text-yellow-800"
                />
                <StatCard
                  title="Zakończone"
                  value={
                    currentTasks.filter((t) => t.status === "completed").length
                  }
                  color="bg-green-100 text-green-800"
                />
              </div>

              {/* task list */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Ładowanie spraw...</p>
                  </div>
                ) : currentTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Brak spraw do przetworzenia</p>
                  </div>
                ) : currentTasks.map((task) => {
                  const priorityClass = getPriorityBadge(task.priority);
                  const statusMeta = getStatusBadge(task.status);
                  return (
                    <Card key={task.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {task.title}
                              </h3>
                              <div className="flex gap-2 mt-2 sm:mt-0">
                                <span
                                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${priorityClass}`}
                                >
                                  {task.priority === "high"
                                    ? "Wysoki"
                                    : task.priority === "medium"
                                      ? "Średni"
                                      : "Niski"}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusMeta.color}`}
                                >
                                  <statusMeta.icon className="h-3 w-3" />
                                  {statusMeta.label}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm font-medium text-gray-500">Klient</p>
                                <p className="text-gray-900">{task.client}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Termin</p>
                                <p className="text-gray-900">{task.deadline.toLocaleDateString("pl-PL")}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Dokumenty</p>
                                <p className="text-gray-900">{task.documents} plików</p>
                              </div>
                            </div>
                            {task.description && (
                              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                                <p className="text-sm font-medium text-blue-800 mb-1">Uwagi klienta:</p>
                                <p className="text-blue-700 text-sm">{task.description}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 lg:ml-4">
                            <Button size="sm" className="w-full lg:w-auto" asChild>
                              <Link href={`/panel-operatora/sprawa/${task.caseId}`}>
                                <FileText className="mr-2 h-4 w-4" />
                                Otwórz sprawę
                              </Link>
                            </Button>
                            {task.status === "pending" && (
                              <Button size="sm" variant="outline" className="w-full lg:w-auto">
                                Rozpocznij pracę
                              </Button>
                            )}
                            {task.status === "in_progress" && (
                              <Button size="sm" variant="outline" className="w-full lg:w-auto">
                                Zakończ
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="w-full lg:w-auto">
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Kontakt
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {activeTab !== "zadania" && (
            <div className="text-center text-gray-500 pt-20">
              Funkcjonalność „{activeTab}” jest w trakcie tworzenia.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*                               SUB-COMPONENT                            */
/* ---------------------------------------------------------------------- */
function StatCard({
  title,
  value,
  color,
  suffix = ""
}: {
  title: string;
  value: number;
  color: string;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-gray-500">{title}</p>
        <p className={`mt-2 text-3xl font-semibold ${color}`}>{value}{suffix}</p>
      </CardContent>
    </Card>
  );
}
