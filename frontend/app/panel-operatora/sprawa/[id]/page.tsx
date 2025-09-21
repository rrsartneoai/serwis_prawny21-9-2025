"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { operatorAPI, OperatorCase, CreateAnalysisData, CreateLegalDocumentData } from "@/lib/api/operator";
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  MessageSquare,
  Send,
  Plus,
  Edit,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  DollarSign,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface CaseDetail {
  id: string;
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNotes: string;
  status: "new" | "processing" | "analysis_ready" | "documents_ready" | "completed";
  packageType: string;
  packagePrice: number;
  createdAt: Date;
  deadline: Date;
  documents: Array<{
    id: string;
    filename: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
  analysis?: {
    id: string;
    content: string;
    summary: string;
    recommendations: string;
    isPreview: boolean;
    createdAt: Date;
  };
  legalDocuments: Array<{
    id: string;
    documentName: string;
    documentType: string;
    price: number;
    isPurchased: boolean;
    isPreview: boolean;
    instructions: string;
  }>;
}

const communicationTemplates = [
  {
    id: "unclear_docs",
    title: "Niewyraźne dokumenty",
    content: "Szanowny Kliencie, otrzymane dokumenty są nieczytelne. Proszę o przesłanie skanów w lepszej jakości lub zdjęć z lepszym oświetleniem.",
  },
  {
    id: "need_more_info",
    title: "Potrzebne dodatkowe informacje",
    content: "W celu przeprowadzenia pełnej analizy potrzebujemy dodatkowych informacji. Proszę o kontakt telefoniczny lub uzupełnienie danych.",
  },
  {
    id: "analysis_ready",
    title: "Analiza gotowa",
    content: "Analiza Państwa sprawy została zakończona i jest dostępna w panelu klienta. Zapraszamy do zapoznania się z wynikami.",
  },
  {
    id: "documents_ready",
    title: "Dokumenty gotowe",
    content: "Przygotowane pisma prawne są dostępne w Państwa panelu. Załączono instrukcje dotyczące dalszego postępowania.",
  },
];

export default function OperatorCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  
  const [caseDetail, setCaseDetail] = useState<OperatorCase | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [analysisContent, setAnalysisContent] = useState("");
  const [analysisSummary, setAnalysisSummary] = useState("");
  const [analysisRecommendations, setAnalysisRecommendations] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [newDocumentName, setNewDocumentName] = useState("");
  const [newDocumentPrice, setNewDocumentPrice] = useState("");
  const [newDocumentInstructions, setNewDocumentInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [documentsummary, setDocumentSummary] = useState<any>(null);

  // Redirect if not authenticated or not operator
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/logowanie');
    } else if (user?.role !== 'operator') {
      router.push('/'); // Redirect non-operators
    }
  }, [isAuthenticated, user, router]);

  // Load real case data from API
  useEffect(() => {
    if (isAuthenticated && user?.role === 'operator') {
      loadCaseDetail();
    }
  }, [caseId, isAuthenticated, user]);

  // Load documents summary when case is loaded
  useEffect(() => {
    if (caseDetail) {
      loadDocumentsSummary();
    }
  }, [caseDetail]);

  const loadCaseDetail = async () => {
    setIsLoading(true);
    const { case: operatorCase, error } = await operatorAPI.getCase(parseInt(caseId));
    
    if (error) {
      toast({
        title: "Błąd",
        description: error,
        variant: "destructive",
      });
    } else if (operatorCase) {
      setCaseDetail(operatorCase);
      // Populate form fields if analysis exists
      if (operatorCase.analysis) {
        setAnalysisContent(operatorCase.analysis.content);
        setAnalysisSummary(operatorCase.analysis.summary || '');
        setAnalysisRecommendations(operatorCase.analysis.recommendations || '');
      }
    }
    setIsLoading(false);
  };

  const handleGenerateAIAnalysis = async () => {
    if (!caseDetail) return;
    
    setIsGeneratingAI(true);
    try {
      const result = await operatorAPI.triggerAIAnalysis(caseDetail.id);
      
      if (result.success && result.analysis) {
        toast({
          title: "Analiza AI wygenerowana!",
          description: "Automatyczna analiza została utworzona pomyślnie.",
        });
        
        // Update the form with AI-generated content
        setAnalysisContent(result.analysis.content);
        setAnalysisSummary(result.analysis.summary || "");
        setAnalysisRecommendations(result.analysis.recommendations || "");
        
        // Reload case data to get updated analysis
        await loadCaseDetail();
      } else {
        throw new Error(result.error || "Nie udało się wygenerować analizy");
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Nie udało się wygenerować analizy AI",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const loadDocumentsSummary = async () => {
    if (!caseDetail) return;
    
    try {
      const result = await operatorAPI.getDocumentsSummary(caseDetail.id);
      
      if (result.success && result.summary) {
        setDocumentSummary(result.summary.summary);
      }
    } catch (error) {
      console.error("Failed to load documents summary:", error);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysisContent.trim() || !caseDetail) {
      toast({
        title: "Błąd",
        description: "Treść analizy nie może być pusta",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const analysisData: CreateAnalysisData = {
      case_id: caseDetail.id,
      content: analysisContent,
      summary: analysisSummary,
      recommendations: analysisRecommendations,
    };

    const { analysis, error } = await operatorAPI.createAnalysis(analysisData);
    
    if (error) {
      toast({
        title: "Błąd",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sukces",
        description: "Analiza została zapisana pomyślnie",
      });
      // Reload case to get updated data
      loadCaseDetail();
    }
    setIsLoading(false);
  };

  const handleAddLegalDocument = async () => {
    if (!newDocumentName.trim() || !newDocumentPrice.trim() || !caseDetail) {
      toast({
        title: "Błąd",
        description: "Nazwa dokumentu i cena są wymagane",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const documentData: CreateLegalDocumentData = {
      case_id: caseDetail.id,
      document_name: newDocumentName,
      document_type: "legal_writing",
      content: "Treść dokumentu zostanie przygotowana...", // Placeholder
      price: parseFloat(newDocumentPrice),
      instructions: newDocumentInstructions,
    };

    const { document, error } = await operatorAPI.createLegalDocument(documentData);
    
    if (error) {
      toast({
        title: "Błąd",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sukces",
        description: "Dokument prawny został dodany",
      });
      setNewDocumentName("");
      setNewDocumentPrice("");
      setNewDocumentInstructions("");
      // Reload case to get updated data
      loadCaseDetail();
    }
    setIsLoading(false);
  };

  const handleDownloadDocument = async (documentId: number) => {
    if (!caseDetail) return;
    
    const blob = await operatorAPI.downloadDocument(caseDetail.id, documentId);
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document_${documentId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      toast({
        title: "Błąd",
        description: "Nie udało się pobrać dokumentu",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (template?: typeof communicationTemplates[0]) => {
    const message = template ? template.content : customMessage;
    if (!message.trim() || !caseDetail) {
      toast({
        title: "Błąd",
        description: "Wiadomość nie może być pusta",
        variant: "destructive",
      });
      return;
    }

    const { success, error } = await operatorAPI.sendClientMessage(
      caseDetail.id,
      message,
      template?.id
    );
    
    if (error) {
      toast({
        title: "Błąd",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Wiadomość wysłana",
        description: `Wiadomość została wysłana do klienta: ${caseDetail?.client_name}`,
      });
      setCustomMessage("");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      new: { label: "Nowa", color: "bg-blue-100 text-blue-800", icon: Clock },
      processing: { label: "W trakcie", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      analysis_ready: { label: "Analiza gotowa", color: "bg-green-100 text-green-800", icon: CheckCircle },
      documents_ready: { label: "Dokumenty gotowe", color: "bg-purple-100 text-purple-800", icon: FileText },
      completed: { label: "Zakończona", color: "bg-gray-100 text-gray-800", icon: CheckCircle },
    };
    return statusMap[status] || statusMap.new;
  };

  if (!caseDetail) {
    return <div className="p-10 text-center">Ładowanie...</div>;
  }

  const statusMeta = getStatusBadge(caseDetail.status);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Powrót
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{caseDetail.title}</h1>
                <p className="text-gray-600">Sprawa #{caseDetail.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusMeta.color}`}>
                <statusMeta.icon className="h-4 w-4" />
                {statusMeta.label}
              </span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="overview">Przegląd</TabsTrigger>
              <TabsTrigger value="analysis">Analiza</TabsTrigger>
              <TabsTrigger value="documents">Pisma prawne</TabsTrigger>
              <TabsTrigger value="communication">Komunikacja</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Case Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Informacje o kliencie
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Imię i nazwisko</Label>
                      <p className="text-gray-900">{caseDetail.client_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <p className="text-gray-900">{caseDetail.client_email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Telefon</Label>
                      <p className="text-gray-900">{caseDetail.client_phone || 'Brak danych'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Pakiet</Label>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900 capitalize">{caseDetail.package_type}</p>
                        <Badge variant="secondary">{caseDetail.package_price} zł</Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Termin</Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <p className="text-gray-900">{caseDetail.deadline ? new Date(caseDetail.deadline).toLocaleDateString("pl-PL") : 'Brak terminu'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Uwagi klienta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-900">{caseDetail.client_notes || "Brak uwag od klienta"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Dokumenty ({caseDetail.documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {caseDetail.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{doc.original_filename}</p>
                            <p className="text-sm text-gray-500">
                              {(doc.file_size / 1024 / 1024).toFixed(1)} MB • {new Date(doc.uploaded_at).toLocaleDateString("pl-PL")}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            Podgląd
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDownloadDocument(doc.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            Pobierz
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              {/* Documents Summary Card */}
              {documentsummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Podsumowanie dokumentów
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{documentsummary.total_documents}</p>
                        <p className="text-sm text-blue-800">Dokumentów</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{documentsummary.processed_documents}</p>
                        <p className="text-sm text-green-800">Przetworzonych</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{documentsummary.has_ocr_text}</p>
                        <p className="text-sm text-purple-800">Z tekstem</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          {Math.round(documentsummary.total_text_length / 1000)}k
                        </p>
                        <p className="text-sm text-orange-800">Znaków</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Tworzenie analizy</CardTitle>
                  <p className="text-gray-600">Przygotuj szczegółową analizę dokumentów klienta</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* AI Analysis Button */}
                  <div className="border-b pb-4">
                    <Button
                      onClick={handleGenerateAIAnalysis}
                      disabled={isGeneratingAI || !caseDetail?.documents.length}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      {isGeneratingAI ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Generowanie analizy AI...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🤖</span>
                          Wygeneruj analizę AI
                        </>
                      )}
                    </Button>
                    {!caseDetail?.documents.length && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        Brak dokumentów do analizy
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="analysis-summary">Streszczenie analizy</Label>
                    <Textarea
                      id="analysis-summary"
                      placeholder="Krótkie streszczenie głównych ustaleń..."
                      value={analysisSummary}
                      onChange={(e) => setAnalysisSummary(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="analysis-content">Szczegółowa analiza</Label>
                    <Textarea
                      id="analysis-content"
                      placeholder="Szczegółowa analiza dokumentów, podstawy prawne, ocena sytuacji..."
                      value={analysisContent}
                      onChange={(e) => setAnalysisContent(e.target.value)}
                      rows={8}
                    />
                  </div>

                  <div>
                    <Label htmlFor="analysis-recommendations">Rekomendacje</Label>
                    <Textarea
                      id="analysis-recommendations"
                      placeholder="Zalecane działania, możliwe opcje postępowania..."
                      value={analysisRecommendations}
                      onChange={(e) => setAnalysisRecommendations(e.target.value)}
                      rows={5}
                    />
                  </div>

                  <Button onClick={handleSaveAnalysis} disabled={isLoading} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? "Zapisywanie..." : "Zapisz analizę"}
                  </Button>

                  {caseDetail.analysis && (
                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-4">Aktualna analiza</h3>
                      <div className="bg-green-50 p-4 rounded-lg space-y-3">
                        <div>
                          <p className="font-medium text-green-800">Streszczenie:</p>
                          <p className="text-green-700">{caseDetail.analysis.summary}</p>
                        </div>
                        <div>
                          <p className="font-medium text-green-800">Szczegóły:</p>
                          <p className="text-green-700">{caseDetail.analysis.content}</p>
                        </div>
                        <div>
                          <p className="font-medium text-green-800">Rekomendacje:</p>
                          <p className="text-green-700">{caseDetail.analysis.recommendations}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dodaj nowe pismo prawne</CardTitle>
                  <p className="text-gray-600">Wystaw klientowi dostępne pisma do zakupu</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="doc-name">Nazwa dokumentu</Label>
                      <Input
                        id="doc-name"
                        placeholder="np. Skarga na czynność komornika"
                        value={newDocumentName}
                        onChange={(e) => setNewDocumentName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="doc-price">Cena (zł)</Label>
                      <Input
                        id="doc-price"
                        type="number"
                        placeholder="59"
                        value={newDocumentPrice}
                        onChange={(e) => setNewDocumentPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="doc-instructions">Instrukcje dla klienta</Label>
                    <Textarea
                      id="doc-instructions"
                      placeholder="Instrukcje dotyczące tego, co klient ma zrobić z dokumentem (np. nadać na poczcie)..."
                      value={newDocumentInstructions}
                      onChange={(e) => setNewDocumentInstructions(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Button onClick={handleAddLegalDocument} disabled={isLoading} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    {isLoading ? "Dodawanie..." : "Dodaj pismo prawne"}
                  </Button>
                </CardContent>
              </Card>

              {caseDetail.legal_documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Wystawione pisma prawne</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {caseDetail.legal_documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium">{doc.document_name}</h4>
                            <p className="text-sm text-gray-600">{doc.instructions}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">{doc.price} zł</Badge>
                            <Badge variant={doc.is_purchased ? "default" : "outline"}>
                              {doc.is_purchased ? "Zakupione" : "Dostępne"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="communication" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Szablony komunikacji</CardTitle>
                  <p className="text-gray-600">Szybkie wiadomości do klienta</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {communicationTemplates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{template.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{template.content}</p>
                      </div>
                      <Button size="sm" onClick={() => handleSendMessage(template)}>
                        <Send className="mr-2 h-4 w-4" />
                        Wyślij
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Niestandardowa wiadomość</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Wpisz wiadomość do klienta..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={() => handleSendMessage()} disabled={!customMessage.trim()}>
                    <Send className="mr-2 h-4 w-4" />
                    Wyślij wiadomość
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}