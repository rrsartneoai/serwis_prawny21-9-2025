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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Clock,
  Eye,
  FileText,
  AlertCircle,
  CheckCircle,
  User,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  created_at: string;
  last_contact?: string;
  cases_count: number;
  satisfaction_rating?: number;
  notes?: string;
  total_spent: number;
  preferred_contact: "EMAIL" | "PHONE" | "SMS";
}

interface ClientCase {
  id: number;
  subject: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  created_at: string;
  updated_at: string;
  assigned_operator?: string;
}

const statusLabels = {
  ACTIVE: "Aktywny",
  INACTIVE: "Nieaktywny",
  PENDING: "Oczekuje",
};

const statusColors = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  PENDING: "bg-yellow-100 text-yellow-800",
};

const caseStatusLabels = {
  PENDING: "Oczekuje",
  IN_PROGRESS: "W trakcie",
  COMPLETED: "Zakończona",
  CANCELLED: "Anulowana",
};

const caseStatusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function OperatorClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientCases, setClientCases] = useState<ClientCase[]>([]);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      // Mock data since backend not yet implemented
      const mockClients: Client[] = [
        {
          id: 1,
          first_name: "Jan",
          last_name: "Kowalski",
          email: "jan.kowalski@email.com",
          phone: "+48 123 456 789",
          status: "ACTIVE",
          created_at: "2024-01-15T10:30:00Z",
          last_contact: "2024-01-22T09:15:00Z",
          cases_count: 3,
          satisfaction_rating: 4.5,
          notes: "Klient bardzo zadowolony z obsługi. Preferuje kontakt mailowy.",
          total_spent: 450.00,
          preferred_contact: "EMAIL",
        },
        {
          id: 2,
          first_name: "Anna",
          last_name: "Nowak",
          email: "anna.nowak@email.com",
          phone: "+48 987 654 321",
          status: "ACTIVE",
          created_at: "2024-01-20T14:15:00Z",
          last_contact: "2024-01-22T11:30:00Z",
          cases_count: 1,
          satisfaction_rating: 5.0,
          total_spent: 150.00,
          preferred_contact: "PHONE",
        },
        {
          id: 3,
          first_name: "Piotr",
          last_name: "Wiśniewski",
          email: "piotr.wisniewski@email.com",
          status: "PENDING",
          created_at: "2024-01-22T08:45:00Z",
          cases_count: 1,
          total_spent: 0.00,
          preferred_contact: "EMAIL",
        },
        {
          id: 4,
          first_name: "Maria",
          last_name: "Wojcik",
          email: "maria.wojcik@email.com",
          phone: "+48 555 666 777",
          status: "ACTIVE",
          created_at: "2024-01-18T16:20:00Z",
          last_contact: "2024-01-21T13:45:00Z",
          cases_count: 2,
          satisfaction_rating: 4.0,
          total_spent: 300.00,
          preferred_contact: "SMS",
        },
      ];

      setClients(mockClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Błąd podczas pobierania klientów");
    } finally {
      setLoading(false);
    }
  };

  const fetchClientCases = async (clientId: number) => {
    try {
      // Mock client cases
      const mockCases: ClientCase[] = [
        {
          id: 1,
          subject: "Pomoc w sporządzeniu pozwu",
          status: "IN_PROGRESS",
          priority: "HIGH",
          created_at: "2024-01-22T10:30:00Z",
          updated_at: "2024-01-22T11:00:00Z",
          assigned_operator: "Operator testowy",
        },
        {
          id: 2,
          subject: "Konsultacja prawna - prawo pracy",
          status: "COMPLETED",
          priority: "MEDIUM",
          created_at: "2024-01-20T09:15:00Z",
          updated_at: "2024-01-21T14:30:00Z",
          assigned_operator: "Operator testowy",
        },
      ];

      setClientCases(mockCases);
    } catch (error) {
      console.error("Error fetching client cases:", error);
    }
  };

  const openClientDetails = async (client: Client) => {
    setSelectedClient(client);
    await fetchClientCases(client.id);
    setShowClientDetails(true);
  };

  const handleAddNote = async () => {
    if (!selectedClient || !newNote.trim()) return;

    try {
      // Update client notes
      const updatedClient = { 
        ...selectedClient, 
        notes: `${selectedClient.notes || ''}\n${new Date().toLocaleDateString('pl-PL')}: ${newNote}`.trim()
      };
      
      setSelectedClient(updatedClient);
      setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
      
      toast.success("Notatka została dodana");
      setNewNote("");
      setShowAddNote(false);
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Błąd podczas dodawania notatki");
    }
  };

  const handleContactClient = (client: Client, method: "EMAIL" | "PHONE" | "SMS") => {
    switch (method) {
      case "EMAIL":
        window.location.href = `mailto:${client.email}`;
        break;
      case "PHONE":
        if (client.phone) {
          window.location.href = `tel:${client.phone}`;
        }
        break;
      case "SMS":
        if (client.phone) {
          window.location.href = `sms:${client.phone}`;
        }
        break;
    }
    
    // Update last contact time
    const updatedClient = { ...client, last_contact: new Date().toISOString() };
    setClients(clients.map(c => c.id === client.id ? updatedClient : c));
    if (selectedClient?.id === client.id) {
      setSelectedClient(updatedClient);
    }
  };

  const filteredClients = clients.filter((client) => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.phone?.includes(searchQuery) ?? false);
    
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Klienci</h1>
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
          <h1 className="text-3xl font-bold">Klienci</h1>
          <p className="text-muted-foreground">
            Zarządzaj kontaktami z klientami i ich sprawami
          </p>
        </div>
        <Button variant="outline" onClick={fetchClients}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Odśwież
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Wszyscy klienci
                </p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aktywni klienci
                </p>
                <p className="text-2xl font-bold">
                  {clients.filter(c => c.status === "ACTIVE").length}
                </p>
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
                  Nowi klienci
                </p>
                <p className="text-2xl font-bold">
                  {clients.filter(c => c.status === "PENDING").length}
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Średnia ocena
                </p>
                <p className="text-2xl font-bold">
                  {(clients
                    .filter(c => c.satisfaction_rating)
                    .reduce((acc, c) => acc + (c.satisfaction_rating || 0), 0) / 
                    clients.filter(c => c.satisfaction_rating).length || 0
                  ).toFixed(1)}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-purple-600" />
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
                  placeholder="Szukaj klientów..."
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
                <SelectItem value="ACTIVE">Aktywni</SelectItem>
                <SelectItem value="PENDING">Oczekujący</SelectItem>
                <SelectItem value="INACTIVE">Nieaktywni</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista klientów ({filteredClients.length})</CardTitle>
          <CardDescription>
            Wszystkie kontakty z klientami
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Klient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Liczba spraw</TableHead>
                <TableHead>Ostatni kontakt</TableHead>
                <TableHead>Ocena</TableHead>
                <TableHead>Wydano</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={undefined} />
                        <AvatarFallback>
                          {client.first_name[0]}{client.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {client.first_name} {client.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[client.status]}>
                      {statusLabels[client.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
                      {client.cases_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.last_contact ? (
                      <div className="text-sm text-muted-foreground">
                        {new Date(client.last_contact).toLocaleDateString("pl-PL")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Brak kontaktu</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.satisfaction_rating ? (
                      <span className="text-sm">
                        ⭐ {client.satisfaction_rating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {client.total_spent.toFixed(2)} PLN
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openClientDetails(client)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleContactClient(client, "EMAIL")}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleContactClient(client, "PHONE")}
                        disabled={!client.phone}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleContactClient(client, "SMS")}
                        disabled={!client.phone}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Client Details Dialog */}
      <Dialog open={showClientDetails} onOpenChange={setShowClientDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Szczegóły klienta: {selectedClient?.first_name} {selectedClient?.last_name}
            </DialogTitle>
            <DialogDescription>
              Pełne informacje o kliencie i jego sprawach
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <Tabs defaultValue="info" className="space-y-4">
              <TabsList>
                <TabsTrigger value="info">Informacje</TabsTrigger>
                <TabsTrigger value="cases">Sprawy ({clientCases.length})</TabsTrigger>
                <TabsTrigger value="notes">Notatki</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Imię i nazwisko</Label>
                    <p className="text-sm text-gray-600">
                      {selectedClient.first_name} {selectedClient.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-gray-600">{selectedClient.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Telefon</Label>
                    <p className="text-sm text-gray-600">
                      {selectedClient.phone || "Brak"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={statusColors[selectedClient.status]}>
                      {statusLabels[selectedClient.status]}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Data rejestracji</Label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedClient.created_at).toLocaleDateString("pl-PL")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Ostatni kontakt</Label>
                    <p className="text-sm text-gray-600">
                      {selectedClient.last_contact 
                        ? new Date(selectedClient.last_contact).toLocaleDateString("pl-PL")
                        : "Brak"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Ocena zadowolenia</Label>
                    <p className="text-sm text-gray-600">
                      {selectedClient.satisfaction_rating 
                        ? `⭐ ${selectedClient.satisfaction_rating.toFixed(1)}/5`
                        : "Brak oceny"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Łączne wydatki</Label>
                    <p className="text-sm text-gray-600">
                      {selectedClient.total_spent.toFixed(2)} PLN
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cases" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Temat</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priorytet</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Data utworzenia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientCases.map((case_item) => (
                      <TableRow key={case_item.id}>
                        <TableCell>{case_item.subject}</TableCell>
                        <TableCell>
                          <Badge className={caseStatusColors[case_item.status]}>
                            {caseStatusLabels[case_item.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{case_item.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          {case_item.assigned_operator || "Nie przypisano"}
                        </TableCell>
                        <TableCell>
                          {new Date(case_item.created_at).toLocaleDateString("pl-PL")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Notatki</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddNote(true)}
                  >
                    Dodaj notatkę
                  </Button>
                </div>
                <div className="min-h-[200px] p-3 border rounded-lg bg-gray-50">
                  {selectedClient.notes ? (
                    <pre className="text-sm whitespace-pre-wrap">
                      {selectedClient.notes}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Brak notatek dla tego klienta
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientDetails(false)}>
              Zamknij
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj notatkę</DialogTitle>
            <DialogDescription>
              Dodaj notatkę dotyczącą klienta {selectedClient?.first_name} {selectedClient?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Wpisz notatkę..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNote(false)}>
              Anuluj
            </Button>
            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
              Dodaj notatkę
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}