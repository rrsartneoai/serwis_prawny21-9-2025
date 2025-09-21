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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  CreditCard,
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface Subscription {
  id: number;
  user_id: number;
  plan_type: string;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "TRIAL";
  amount: number;
  currency: string;
  billing_cycle: "MONTHLY" | "YEARLY";
  created_at: string;
  expires_at: string;
  last_payment: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface SubscriptionStats {
  total: number;
  active: number;
  trial: number;
  cancelled: number;
  revenue: number;
  monthly_revenue: number;
}

const statusLabels = {
  ACTIVE: "Aktywna",
  CANCELLED: "Anulowana",
  EXPIRED: "Wygasła",
  TRIAL: "Próbna",
};

const statusColors = {
  ACTIVE: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  EXPIRED: "bg-gray-100 text-gray-800",
  TRIAL: "bg-blue-100 text-blue-800",
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [stats, setStats] = useState<SubscriptionStats>({
    total: 0,
    active: 0,
    trial: 0,
    cancelled: 0,
    revenue: 0,
    monthly_revenue: 0,
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      // Mock data since backend endpoint not yet implemented
      const mockSubscriptions: Subscription[] = [
        {
          id: 1,
          user_id: 1,
          plan_type: "Pro",
          status: "ACTIVE",
          amount: 99.00,
          currency: "PLN",
          billing_cycle: "MONTHLY",
          created_at: "2024-01-15T10:30:00Z",
          expires_at: "2024-02-15T10:30:00Z",
          last_payment: "2024-01-15T10:30:00Z",
          user: {
            id: 1,
            email: "admin@prawnik.ai",
            first_name: "Admin",
            last_name: "Testowy",
          },
        },
        {
          id: 2,
          user_id: 3,
          plan_type: "Basic",
          status: "TRIAL",
          amount: 49.00,
          currency: "PLN",
          billing_cycle: "MONTHLY",
          created_at: "2024-01-20T14:15:00Z",
          expires_at: "2024-02-04T14:15:00Z",
          last_payment: "",
          user: {
            id: 3,
            email: "client@prawnik.ai",
            first_name: "Klient",
            last_name: "Testowy",
          },
        },
      ];

      setSubscriptions(mockSubscriptions);
      
      // Calculate stats
      setStats({
        total: mockSubscriptions.length,
        active: mockSubscriptions.filter(s => s.status === "ACTIVE").length,
        trial: mockSubscriptions.filter(s => s.status === "TRIAL").length,
        cancelled: mockSubscriptions.filter(s => s.status === "CANCELLED").length,
        revenue: mockSubscriptions.reduce((sum, s) => sum + s.amount, 0),
        monthly_revenue: mockSubscriptions
          .filter(s => s.status === "ACTIVE" && s.billing_cycle === "MONTHLY")
          .reduce((sum, s) => sum + s.amount, 0),
      });
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const userName = `${subscription.user.first_name} ${subscription.user.last_name}`.toLowerCase();
    const matchesSearch =
      subscription.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userName.includes(searchQuery.toLowerCase()) ||
      subscription.plan_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || subscription.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Subskrypcje</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
          <h1 className="text-3xl font-bold">Subskrypcje</h1>
          <p className="text-muted-foreground">
            Zarządzaj subskrypcjami i płatnościami użytkowników
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Wszystkie subskrypcje
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aktywne subskrypcje
                </p>
                <p className="text-2xl font-bold">{stats.active}</p>
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
                  Okresy próbne
                </p>
                <p className="text-2xl font-bold">{stats.trial}</p>
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
                  Miesięczny przychód
                </p>
                <p className="text-2xl font-bold">{stats.monthly_revenue.toFixed(2)} PLN</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Szukaj subskrypcji..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtruj po statusie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="ACTIVE">Aktywne</SelectItem>
                <SelectItem value="TRIAL">Próbne</SelectItem>
                <SelectItem value="CANCELLED">Anulowane</SelectItem>
                <SelectItem value="EXPIRED">Wygasłe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista subskrypcji ({filteredSubscriptions.length})</CardTitle>
          <CardDescription>
            Wszystkie subskrypcje w systemie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Użytkownik</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cena</TableHead>
                <TableHead>Cykl płatności</TableHead>
                <TableHead>Data utworzenia</TableHead>
                <TableHead>Wygasa</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={undefined} />
                        <AvatarFallback>
                          {subscription.user.first_name?.[0] || ''}{subscription.user.last_name?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {`${subscription.user.first_name} ${subscription.user.last_name}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{subscription.plan_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[subscription.status]}>
                      {statusLabels[subscription.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {subscription.amount.toFixed(2)} {subscription.currency}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {subscription.billing_cycle === "MONTHLY" ? "Miesięcznie" : "Rocznie"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(subscription.created_at).toLocaleDateString("pl-PL")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(subscription.expires_at).toLocaleDateString("pl-PL")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSubscription(subscription);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Szczegóły subskrypcji</DialogTitle>
            <DialogDescription>
              Pełne informacje o subskrypcji #{selectedSubscription?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Użytkownik</p>
                  <p className="text-sm text-gray-600">
                    {`${selectedSubscription.user.first_name} ${selectedSubscription.user.last_name}`}
                  </p>
                  <p className="text-xs text-gray-500">{selectedSubscription.user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Plan</p>
                  <p className="text-sm text-gray-600">{selectedSubscription.plan_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge className={statusColors[selectedSubscription.status]}>
                    {statusLabels[selectedSubscription.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Kwota</p>
                  <p className="text-sm text-gray-600">
                    {selectedSubscription.amount.toFixed(2)} {selectedSubscription.currency}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Data utworzenia</p>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedSubscription.created_at).toLocaleDateString("pl-PL")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Data wygaśnięcia</p>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedSubscription.expires_at).toLocaleDateString("pl-PL")}
                  </p>
                </div>
                {selectedSubscription.last_payment && (
                  <div>
                    <p className="text-sm font-medium">Ostatnia płatność</p>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedSubscription.last_payment).toLocaleDateString("pl-PL")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}