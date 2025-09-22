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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Tag,
  Star,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: number;
  name: string;
  subject: string | null;
  content: string;
  category: "LEGAL_ADVICE" | "DOCUMENTS" | "CONSULTATION" | "GENERAL" | "URGENT" | string;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

const categoryLabels = {
  LEGAL_ADVICE: "Porada prawna",
  DOCUMENTS: "Dokumenty",
  CONSULTATION: "Konsultacja",
  GENERAL: "Ogólne",
  URGENT: "Pilne",
} as const;

const categoryColors = {
  LEGAL_ADVICE: "bg-blue-100 text-blue-800",
  DOCUMENTS: "bg-green-100 text-green-800",
  CONSULTATION: "bg-purple-100 text-purple-800",
  GENERAL: "bg-gray-100 text-gray-800",
  URGENT: "bg-red-100 text-red-800",
} as const;

export default function OperatorTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    content: "",
    category: "GENERAL" as Template["category"],
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/templates", { headers: { "Content-Type": "application/json" } });
      if (!res.ok) throw new Error("Failed to load templates");
      const data: Template[] = await res.json();
      if (!data.length) seedDefaults(); else setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Błąd podczas pobierania szablonów");
    } finally {
      setLoading(false);
    }
  };

  const seedDefaults = async () => {
    const defaults = [
      { name: "Powitanie nowego klienta", subject: "Witamy w Kancelarii X - Twoja sprawa", content: "Dzień dobry {CLIENT_NAME},\n\nDziękujemy za wybór naszej kancelarii...", category: "GENERAL" },
      { name: "Prośba o dodatkowe dokumenty", subject: "Sprawa - dokumenty", content: "Dzień dobry {CLIENT_NAME},\n\nProsimy o przesłanie: {DOCUMENT_LIST}", category: "DOCUMENTS" },
      { name: "Analiza prawna gotowa", subject: "Analiza sprawy gotowa", content: "Analiza sprawy \"{CASE_TITLE}\" jest dostępna w panelu.", category: "LEGAL_ADVICE" },
      { name: "Sprawa pilna - szybki kontakt", subject: "PILNE: kontakt", content: "Twoja sprawa została oznaczona jako pilna. Prosimy o natychmiastowy kontakt.", category: "URGENT" },
    ];
    try {
      await Promise.all(defaults.map(t => fetch("/api/v1/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...t, is_favorite: false }) })));
      await fetchTemplates();
    } catch {}
  };

  const handleCreateTemplate = async () => {
    try {
      const res = await fetch("/api/v1/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData }) });
      if (!res.ok) throw new Error("Create failed");
      const created = await res.json();
      setTemplates(prev => [created, ...prev]);
      toast.success("Szablon został utworzony");
      resetForm();
      setShowCreateModal(false);
    } catch (e) {
      toast.error("Błąd podczas tworzenia szablonu");
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await fetch(`/api/v1/templates/${selectedTemplate.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData }) });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
      toast.success("Szablon został zaktualizowany");
      resetForm();
      setShowEditModal(false);
      setSelectedTemplate(null);
    } catch (e) {
      toast.error("Błąd podczas aktualizacji szablonu");
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      const res = await fetch(`/api/v1/templates/${templateId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success("Szablon został usunięty");
    } catch {
      toast.error("Błąd podczas usuwania szablonu");
    }
  };

  const handleToggleFavorite = async (templateId: number) => {
    setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, is_favorite: !t.is_favorite } : t));
  };

  const handleCopyTemplate = async (template: Template) => {
    try {
      await navigator.clipboard.writeText(template.content);
      toast.success("Zawartość szablonu została skopiowana");
      await fetch(`/api/v1/templates/${template.id}/use`, { method: "POST" });
    } catch (error) {
      console.error("Error copying template:", error);
      toast.error("Błąd podczas kopiowania");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", subject: "", content: "", category: "GENERAL" });
  };

  const openEditModal = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({ name: template.name, subject: template.subject || "", content: template.content, category: template.category });
    setShowEditModal(true);
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Szablony odpowiedzi</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <h1 className="text-3xl font-bold">Szablony odpowiedzi</h1>
          <p className="text-muted-foreground">
            Zarządzaj gotowymi odpowiedziami dla klientów
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchTemplates}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Odśwież
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nowy szablon
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Wszystkie szablony
                </p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Tag className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ulubione
                </p>
                <p className="text-2xl font-bold">
                  {templates.filter(t => t.is_favorite).length}
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Łączne użycia (sesja)
                </p>
                <p className="text-2xl font-bold">
                  {templates.reduce((sum, t) => sum + (t.usage_count || 0), 0)}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Copy className="h-4 w-4 text-green-600" />
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
                  placeholder="Szukaj szablonów..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtruj po kategorii" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie kategorie</SelectItem>
                <SelectItem value="LEGAL_ADVICE">Porada prawna</SelectItem>
                <SelectItem value="DOCUMENTS">Dokumenty</SelectItem>
                <SelectItem value="CONSULTATION">Konsultacja</SelectItem>
                <SelectItem value="GENERAL">Ogólne</SelectItem>
                <SelectItem value="URGENT">Pilne</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Szablony ({filteredTemplates.length})</CardTitle>
          <CardDescription>
            Lista wszystkich szablonów odpowiedzi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead>Kategoria</TableHead>
                <TableHead>Użycie</TableHead>
                <TableHead>Ostatnia modyfikacja</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {template.is_favorite && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {template.subject}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={categoryColors[(template.category as keyof typeof categoryColors) || 'GENERAL'] || categoryColors.GENERAL}>
                      {categoryLabels[(template.category as keyof typeof categoryLabels) || 'GENERAL'] || template.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Copy className="h-4 w-4 mr-1 text-muted-foreground" />
                      {template.usage_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      {new Date(template.updated_at).toLocaleDateString("pl-PL")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedTemplate(template); setShowPreviewModal(true); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyTemplate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(template.id)}
                      >
                        <Star 
                          className={`h-4 w-4 ${template.is_favorite ? 'text-yellow-500 fill-current' : ''}`} 
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Utwórz nowy szablon</DialogTitle>
            <DialogDescription>
              Dodaj nowy szablon odpowiedzi dla klientów
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nazwa szablonu</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Powitanie nowego klienta"
              />
            </div>
            <div>
              <Label htmlFor="category">Kategoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value: Template["category"]) => 
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">Ogólne</SelectItem>
                  <SelectItem value="LEGAL_ADVICE">Porada prawna</SelectItem>
                  <SelectItem value="DOCUMENTS">Dokumenty</SelectItem>
                  <SelectItem value="CONSULTATION">Konsultacja</SelectItem>
                  <SelectItem value="URGENT">Pilne</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject">Temat wiadomości</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="np. Twoja sprawa #{CASE_ID}"
              />
            </div>
            <div>
              <Label htmlFor="content">Treść szablonu</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                placeholder="Użyj zmiennych jak {CLIENT_NAME}, {CASE_TITLE}, {OPERATOR_NAME}"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Anuluj
            </Button>
            <Button onClick={handleCreateTemplate}>Utwórz szablon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edytuj szablon</DialogTitle>
            <DialogDescription>
              Zmodyfikuj szablon "{selectedTemplate?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Nazwa szablonu</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_category">Kategoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value: Template["category"]) => 
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">Ogólne</SelectItem>
                  <SelectItem value="LEGAL_ADVICE">Porada prawna</SelectItem>
                  <SelectItem value="DOCUMENTS">Dokumenty</SelectItem>
                  <SelectItem value="CONSULTATION">Konsultacja</SelectItem>
                  <SelectItem value="URGENT">Pilne</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_subject">Temat wiadomości</Label>
              <Input
                id="edit_subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_content">Treść szablonu</Label>
              <Textarea
                id="edit_content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Anuluj
            </Button>
            <Button onClick={handleUpdateTemplate}>Zapisz zmiany</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Podgląd szablonu</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label>Temat</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {selectedTemplate.subject}
                </div>
              </div>
              <div>
                <Label>Treść</Label>
                <div className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {selectedTemplate.content}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Zamknij
            </Button>
            {selectedTemplate && (
              <Button onClick={() => handleCopyTemplate(selectedTemplate)}>
                <Copy className="h-4 w-4 mr-2" />
                Kopiuj treść
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}