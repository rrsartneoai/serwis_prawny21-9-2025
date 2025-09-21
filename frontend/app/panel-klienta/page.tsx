"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { casesApi, type Case } from "@/lib/api/cases";
import { paymentsApi, type Payment } from "@/lib/api/payments";
import { notificationsApi, type Notification } from "@/lib/api/notifications";
import { useRouter } from "next/navigation";
import {
  FileText,
  Eye,
  Plus,
  Search,
  Filter,
  User,
  Settings,
  History,
  MessageSquare,
  CreditCard,
  Clock,
  CheckCircle,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import NewCaseForm from "@/components/forms/new-case-form"; // Import NewCaseForm component

/**
 * Lightweight placeholder until the full client dashboard is finished.
 * Keeps the `/panel-klienta` route compiling and deployable.
 */
export default function PanelKlientaPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("sprawy");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/logowanie");
      return;
    }
  }, [isAuthenticated, router]);

  // Load data from APIs
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Load all data in parallel for better performance
        const [casesResponse, paymentsResponse, notificationsResponse, unreadResponse] = await Promise.all([
          casesApi.getCases().catch(err => ({ error: err.message })),
          paymentsApi.getUserPayments().catch(err => ({ error: err.message })),
          notificationsApi.getUserNotifications().catch(err => ({ error: err.message })),
          notificationsApi.getUnreadCount().catch(err => ({ error: err.message }))
        ]);
        
        // Handle cases
        if ('error' in casesResponse && casesResponse.error) {
          console.error('Cases error:', casesResponse.error);
        } else if ('cases' in casesResponse && casesResponse.cases) {
          setCases(casesResponse.cases);
        }
        
        // Handle payments  
        if ('error' in paymentsResponse && paymentsResponse.error) {
          console.error('Payments error:', paymentsResponse.error);
        } else if ('payments' in paymentsResponse && paymentsResponse.payments) {
          setPayments(paymentsResponse.payments);
        }
        
        // Handle notifications
        if ('error' in notificationsResponse && notificationsResponse.error) {
          console.error('Notifications error:', notificationsResponse.error);
        } else if ('notifications' in notificationsResponse && notificationsResponse.notifications) {
          setNotifications(notificationsResponse.notifications);
        }
        
        // Handle unread count
        if ('error' in unreadResponse && unreadResponse.error) {
          console.error('Unread count error:', unreadResponse.error);
        } else if ('unread_count' in unreadResponse && unreadResponse.unread_count !== undefined) {
          setUnreadCount(unreadResponse.unread_count);
        }
        
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Błąd ładowania danych');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  // Add refresh function for after creating new cases
  const refreshCases = async () => {
    setLoading(true);
    const response = await casesApi.getCases();
    if (response.error) {
      setError(response.error);
    } else if (response.cases) {
      setCases(response.cases);
    }
    setLoading(false);
  };

  const refreshPayments = async () => {
    const response = await paymentsApi.getUserPayments();
    if (response.payments) {
      setPayments(response.payments);
    }
  };

  const refreshNotifications = async () => {
    try {
      const [notificationsResponse, unreadResponse] = await Promise.all([
        notificationsApi.getUserNotifications(),
        notificationsApi.getUnreadCount()
      ]);
      
      if (notificationsResponse.notifications) {
        setNotifications(notificationsResponse.notifications);
      }
      
      if (unreadResponse.unread_count !== undefined) {
        setUnreadCount(unreadResponse.unread_count);
      }
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  const sidebarItems = [
    { id: "sprawy", label: "Moje sprawy", icon: FileText },
    { id: "nowa-sprawa", label: "Nowa sprawa", icon: Plus },
    { id: "historia", label: "Historia płatności", icon: History },
    { id: "wiadomosci", label: "Wiadomości", icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: "profil", label: "Mój profil", icon: User },
    { id: "ustawienia", label: "Ustawienia", icon: Settings },
  ];

  const getStatusBadge = (status: Case["status"]) => {
    const statusConfig = {
      draft: { label: "Szkic", color: "bg-gray-100 text-gray-800" },
      new: { label: "Nowa", color: "bg-blue-100 text-blue-800" },
      submitted: { label: "Przesłana", color: "bg-blue-100 text-blue-800" },
      analyzing: {
        label: "Analizujemy",
        color: "bg-yellow-100 text-yellow-800",
      },
      analysis_ready: {
        label: "Analiza gotowa",
        color: "bg-green-100 text-green-800",
      },
      documents_ready: {
        label: "Pisma gotowe",
        color: "bg-purple-100 text-purple-800",
      },
      completed: { label: "Zakończona", color: "bg-gray-100 text-gray-800" },
      cancelled: { label: "Anulowana", color: "bg-red-100 text-red-800" },
      rejected: { label: "Odrzucona", color: "bg-red-100 text-red-800" },
    };

    return statusConfig[status] || statusConfig.new;
  };

  const handlePurchaseDocument = (documentId: string) => {
    // Simulate purchase process
    alert(`Przekierowanie do płatności za dokument ${documentId}`);
  };

  const handleViewFullAnalysis = (analysisId: string) => {
    // Simulate viewing full analysis
    alert(`Przekierowanie do pełnej analizy ${analysisId}`);
  };

  if (!isAuthenticated) {
    return <div className="p-8">Ładowanie…</div>;
  }

  return (
    <div className="min-h-screen flex flex-col font-montserrat bg-gray-50">
      {/* Mobile header with sidebar toggle */}
      <header className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-3"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-semibold">Panel Klienta</h1>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`bg-white shadow-lg transition-all duration-300 z-50 ${
            sidebarOpen 
              ? "fixed lg:static inset-y-0 left-0 w-64" 
              : "w-64 hidden lg:block"
          }`}
        >
          <div className="p-6">
            {/* Mobile close button */}
            <div className="lg:hidden flex justify-end mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">{user?.name}</div>
                <div className="text-sm text-gray-500">Panel klienta</div>
              </div>
            </div>

            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    // Close mobile sidebar when item is clicked
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors font-medium ${
                    activeTab === item.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </div>
                  {item.badge && (
                    <Badge className="bg-red-100 text-red-800 text-xs px-2 py-0.5">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeTab === "sprawy" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Moje sprawy
                </h1>
                <Button onClick={() => setActiveTab("nowa-sprawa")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nowa sprawa
                </Button>
              </div>

              <div className="flex space-x-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Szukaj spraw..." className="pl-10" />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtruj
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {loading ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Ładowanie spraw...</p>
                    </CardContent>
                  </Card>
                ) : error ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-red-600 mb-4">{error}</p>
                      <Button onClick={refreshCases}>Spróbuj ponownie</Button>
                    </CardContent>
                  </Card>
                ) : cases.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Nie masz jeszcze żadnych spraw</p>
                      <Button onClick={() => setActiveTab("nowa-sprawa")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Utwórz pierwszą sprawę
                      </Button>
                    </CardContent>
                  </Card>
                ) : cases.map((case_) => (
                  <Card
                    key={case_.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            {case_.name}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            Utworzona: {case_.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusBadge(case_.status).color}>
                          {getStatusBadge(case_.status).label}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Documents */}
                      <div>
                        <h4 className="font-medium mb-2">
                          Dokumenty ({case_.documents.length})
                        </h4>
                        <div className="space-y-2">
                          {case_.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 text-gray-500 mr-2" />
                                <div>
                                  <span className="text-sm font-medium">
                                    {doc.name}
                                  </span>
                                  <div className="text-xs text-gray-500">
                                    {(doc.size / 1024 / 1024).toFixed(1)} MB •{" "}
                                    {doc.uploadedAt.toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Client Notes */}
                      {case_.clientNotes && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h5 className="text-sm font-medium text-blue-800 mb-1">
                            Twoje notatki:
                          </h5>
                          <p className="text-sm text-blue-700">
                            {case_.clientNotes}
                          </p>
                        </div>
                      )}

                      {/* Analysis */}
                      {case_.analysis && (
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium">Analiza prawna</h4>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-green-100 text-green-800">
                                Gotowa
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {case_.analysis.price} zł
                              </span>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <h5 className="font-medium mb-2">Podsumowanie:</h5>
                            <p className="text-sm text-gray-700 mb-3">
                              {case_.analysis.summary}
                            </p>

                            <div className="mb-3">
                              <h6 className="text-sm font-medium mb-1">
                                Zalecenia:
                              </h6>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {case_.analysis.recommendations.map(
                                  (rec, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                      {rec}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleViewFullAnalysis(case_.analysis!.id)
                                }
                              >
                                <Eye className="mr-2 h-3 w-3" />
                                Zobacz pełną analizę
                              </Button>
                            </div>
                          </div>

                          {/* Available Documents */}
                          {case_.analysis.possibleDocuments.length > 0 && (
                            <div className="space-y-3">
                              <h5 className="text-sm font-medium">
                                Dostępne pisma do zamówienia:
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {case_.analysis.possibleDocuments.map((doc) => (
                                  <Card
                                    key={doc.id}
                                    className="border border-blue-200 hover:shadow-md transition-shadow"
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <h6 className="text-sm font-medium leading-tight">
                                          {doc.name}
                                        </h6>
                                        <span className="text-sm font-bold text-blue-600">
                                          {doc.price} zł
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-600 mb-2">
                                        {doc.description}
                                      </p>
                                      <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs text-gray-500">
                                          <Clock className="h-3 w-3 inline mr-1" />
                                          {doc.estimatedTime}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {doc.category}
                                        </Badge>
                                      </div>
                                      <Button
                                        size="sm"
                                        className="w-full text-xs"
                                        onClick={() =>
                                          handlePurchaseDocument(doc.id)
                                        }
                                      >
                                        <CreditCard className="mr-1 h-3 w-3" />
                                        Zamów
                                      </Button>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {activeTab === "nowa-sprawa" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Nowa Sprawa
                </h1>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("sprawy")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Powrót do Spraw
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Dodaj Nową Sprawę</CardTitle>
                  <p className="text-gray-600">
                    Wypełnij formularz i prześlij dokumenty, aby rozpocząć
                    proces analizy prawnej
                  </p>
                </CardHeader>
                <CardContent>
                  <NewCaseForm onSuccess={() => {
                    setActiveTab("sprawy");
                    refreshCases();
                  }} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payment History Section */}
          {activeTab === "historia" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Historia płatności
                </h1>
                <Button onClick={refreshPayments}>
                  Odśwież
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {loading ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Ładowanie płatności...</p>
                    </CardContent>
                  </Card>
                ) : payments.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Nie masz jeszcze żadnych płatności</p>
                    </CardContent>
                  </Card>
                ) : payments.map((payment) => (
                  <Card key={payment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            Płatność #{payment.id}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(payment.created_at).toLocaleDateString('pl-PL')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl">{payment.amount} {payment.currency}</p>
                          <Badge className={
                            payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {payment.status === 'paid' ? 'Opłacone' :
                             payment.status === 'pending' ? 'Oczekujące' :
                             payment.status === 'failed' ? 'Nieudane' :
                             payment.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{payment.description}</p>
                      <p className="text-sm text-gray-500">Typ: {payment.payment_type}</p>
                      {(payment as any).applied_promotion_code && (
                        <p className="text-sm text-green-600">
                          Promocja: {(payment as any).applied_promotion_code}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Messages Section */}
          {activeTab === "wiadomosci" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Wiadomości
                  {unreadCount > 0 && (
                    <Badge className="ml-2 bg-red-100 text-red-800">
                      {unreadCount} nowe
                    </Badge>
                  )}
                </h1>
                <Button onClick={refreshNotifications}>
                  Odśwież
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {loading ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Ładowanie wiadomości...</p>
                    </CardContent>
                  </Card>
                ) : notifications.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Nie masz jeszcze żadnych wiadomości</p>
                    </CardContent>
                  </Card>
                ) : notifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`hover:shadow-md transition-shadow ${!notification.read_at ? 'border-blue-200 bg-blue-50' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 text-blue-500 mr-2" />
                          <h4 className="font-medium">
                            {notification.subject || notification.template}
                          </h4>
                          {!notification.read_at && (
                            <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                              Nowe
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString('pl-PL')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{notification.content}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {notification.type.toUpperCase()}
                        </span>
                        {!notification.read_at && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              try {
                                await notificationsApi.markAsRead(notification.id);
                                await refreshNotifications();
                              } catch (error) {
                                console.error('Failed to mark as read:', error);
                              }
                            }}
                          >
                            Oznacz jako przeczytane
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Profile Section */}
          {activeTab === "profil" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Mój profil
                </h1>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Informacje o koncie</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Imię i nazwisko</label>
                      <p className="mt-1 text-gray-900">{user?.name || 'Nie podano'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Telefon</label>
                      <p className="mt-1 text-gray-900">{user?.phone || 'Nie podano'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status konta</label>
                      <Badge className={user?.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {user?.is_verified ? 'Zweryfikowane' : 'Niezweryfikowane'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Statystyki</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{cases.length}</p>
                        <p className="text-sm text-gray-600">Liczba spraw</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{payments.length}</p>
                        <p className="text-sm text-gray-600">Płatności</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{notifications.length}</p>
                        <p className="text-sm text-gray-600">Wiadomości</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Section */}
          {activeTab === "ustawienia" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Ustawienia
                </h1>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Ustawienia konta</CardTitle>
                  <p className="text-gray-600">Zarządzaj swoim kontem i preferencjami</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Powiadomienia</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Powiadomienia email</p>
                          <p className="text-sm text-gray-500">Otrzymuj powiadomienia na email</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Powiadomienia SMS</p>
                          <p className="text-sm text-gray-500">Otrzymuj powiadomienia SMS</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Newsletter</p>
                          <p className="text-sm text-gray-500">Otrzymuj newsletter z poradami prawnymi</p>
                        </div>
                        <input type="checkbox" className="rounded" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-3">Bezpieczeństwo</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="mr-2 h-4 w-4" />
                        Zmień hasło
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <User className="mr-2 h-4 w-4" />
                        Aktualizuj dane osobowe
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-3">Inne</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="mr-2 h-4 w-4" />
                        Pobierz dane konta
                      </Button>
                      <Button variant="destructive" className="w-full justify-start">
                        Usuń konto
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
