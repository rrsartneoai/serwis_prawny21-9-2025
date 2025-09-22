"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Bell,
  Shield,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  Save,
  RefreshCw,
  Key,
  Database,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

interface OperatorSettings {
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    bio: string;
    avatar_url?: string;
    work_hours_start: string;
    work_hours_end: string;
    timezone: string;
  };
  notifications: {
    email_new_cases: boolean;
    email_urgent_cases: boolean;
    email_client_messages: boolean;
    sms_urgent_cases: boolean;
    desktop_notifications: boolean;
    notification_sound: boolean;
  };
  workflow: {
    auto_assign_cases: boolean;
    default_response_time: number; // in hours
    case_priority_system: boolean;
    require_case_notes: boolean;
    auto_status_updates: boolean;
  };
  security: {
    two_factor_enabled: boolean;
    session_timeout: number; // in minutes
    password_last_changed: string;
    login_notifications: boolean;
  };
}

export default function OperatorSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<OperatorSettings>({
    profile: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      bio: "",
      work_hours_start: "09:00",
      work_hours_end: "17:00",
      timezone: "Europe/Warsaw",
    },
    notifications: {
      email_new_cases: true,
      email_urgent_cases: true,
      email_client_messages: true,
      sms_urgent_cases: false,
      desktop_notifications: true,
      notification_sound: true,
    },
    workflow: {
      auto_assign_cases: false,
      default_response_time: 24,
      case_priority_system: true,
      require_case_notes: true,
      auto_status_updates: false,
    },
    security: {
      two_factor_enabled: false,
      session_timeout: 60,
      password_last_changed: "2024-01-15T10:30:00Z",
      login_notifications: true,
    },
  });

  useEffect(() => {
    fetchSettings();
    // Load from localStorage if available
    try {
      const raw = localStorage.getItem("operator-settings");
      if (raw) {
        const parsed = JSON.parse(raw) as OperatorSettings;
        setSettings(parsed);
        setLoading(false);
      }
    } catch {}
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API call
      const mockSettings: OperatorSettings = {
        profile: {
          first_name: user?.name?.split(' ')[0] || "Operator",
          last_name: user?.name?.split(' ')[1] || "Testowy",
          email: user?.email || "operator@prawnik.ai",
          phone: "+48 123 456 789",
          bio: "Doświadczony operator prawny specjalizujący się w prawie cywilnym i handlowym.",
          work_hours_start: "09:00",
          work_hours_end: "17:00",
          timezone: "Europe/Warsaw",
        },
        notifications: {
          email_new_cases: true,
          email_urgent_cases: true,
          email_client_messages: true,
          sms_urgent_cases: false,
          desktop_notifications: true,
          notification_sound: true,
        },
        workflow: {
          auto_assign_cases: false,
          default_response_time: 24,
          case_priority_system: true,
          require_case_notes: true,
          auto_status_updates: false,
        },
        security: {
          two_factor_enabled: false,
          session_timeout: 60,
          password_last_changed: "2024-01-15T10:30:00Z",
          login_notifications: true,
        },
      };

      setSettings(mockSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Błąd podczas pobierania ustawień");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Persist to localStorage for now
      try {
        localStorage.setItem("operator-settings", JSON.stringify(settings));
      } catch {}
      
      toast.success("Ustawienia zostały zapisane");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Błąd podczas zapisywania ustawień");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // TODO: Implement password change functionality
    toast.info("Funkcja zmiany hasła będzie dostępna wkrótce");
  };

  const handleExportData = async () => {
    // TODO: Implement data export functionality
    toast.info("Eksport danych zostanie rozpoczęty wkrótce");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Ustawienia</h1>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
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
          <h1 className="text-3xl font-bold">Ustawienia</h1>
          <p className="text-muted-foreground">
            Zarządzaj swoim profilem i preferencjami
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Odśwież
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Zapisywanie..." : "Zapisz"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="notifications">Powiadomienia</TabsTrigger>
          <TabsTrigger value="workflow">Przepływ pracy</TabsTrigger>
          <TabsTrigger value="security">Bezpieczeństwo</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informacje osobiste
              </CardTitle>
              <CardDescription>
                Zarządzaj swoimi podstawowymi informacjami
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={settings.profile.avatar_url} />
                  <AvatarFallback>
                    {settings.profile.first_name[0]}{settings.profile.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    Zmień zdjęcie
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG do 2MB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Imię</Label>
                  <Input
                    id="first_name"
                    value={settings.profile.first_name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        profile: { ...settings.profile, first_name: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nazwisko</Label>
                  <Input
                    id="last_name"
                    value={settings.profile.last_name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        profile: { ...settings.profile, last_name: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        profile: { ...settings.profile, email: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={settings.profile.phone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        profile: { ...settings.profile, phone: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Opis</Label>
                <Textarea
                  id="bio"
                  value={settings.profile.bio}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      profile: { ...settings.profile, bio: e.target.value },
                    })
                  }
                  rows={3}
                  placeholder="Krótki opis Twojego doświadczenia..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="work_start">Początek pracy</Label>
                  <Input
                    id="work_start"
                    type="time"
                    value={settings.profile.work_hours_start}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        profile: { ...settings.profile, work_hours_start: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="work_end">Koniec pracy</Label>
                  <Input
                    id="work_end"
                    type="time"
                    value={settings.profile.work_hours_end}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        profile: { ...settings.profile, work_hours_end: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Strefa czasowa</Label>
                  <Select
                    value={settings.profile.timezone}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        profile: { ...settings.profile, timezone: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Warsaw">Europa/Warszawa</SelectItem>
                      <SelectItem value="Europe/London">Europa/Londyn</SelectItem>
                      <SelectItem value="Europe/Berlin">Europa/Berlin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Powiadomienia
              </CardTitle>
              <CardDescription>
                Skonfiguruj, kiedy i jak chcesz otrzymywać powiadomienia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Powiadomienia email
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Nowe sprawy</p>
                      <p className="text-xs text-muted-foreground">
                        Otrzymuj email gdy zostanie przypisana nowa sprawa
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.email_new_cases}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, email_new_cases: checked },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Pilne sprawy</p>
                      <p className="text-xs text-muted-foreground">
                        Natychmiastowe powiadomienia o sprawach pilnych
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.email_urgent_cases}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, email_urgent_cases: checked },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Wiadomości od klientów</p>
                      <p className="text-xs text-muted-foreground">
                        Powiadomienia o nowych wiadomościach w sprawach
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.email_client_messages}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, email_client_messages: checked },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Powiadomienia SMS
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Pilne sprawy</p>
                      <p className="text-xs text-muted-foreground">
                        SMS w przypadku spraw pilnych poza godzinami pracy
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.sms_urgent_cases}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, sms_urgent_cases: checked },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium flex items-center">
                  <Volume2 className="h-4 w-4 mr-2" />
                  Powiadomienia systemowe
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Powiadomienia na pulpicie</p>
                      <p className="text-xs text-muted-foreground">
                        Wyświetlaj powiadomienia w przeglądarce
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.desktop_notifications}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, desktop_notifications: checked },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Dźwięki powiadomień</p>
                      <p className="text-xs text-muted-foreground">
                        Odtwarzaj dźwięk przy nowych powiadomieniach
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.notification_sound}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, notification_sound: checked },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Przepływ pracy
              </CardTitle>
              <CardDescription>
                Skonfiguruj automatyczne procesy i preferencje pracy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Automatyczne przypisywanie spraw</p>
                  <p className="text-xs text-muted-foreground">
                    Czy system ma automatycznie przypisywać Ci nowe sprawy
                  </p>
                </div>
                <Switch
                  checked={settings.workflow.auto_assign_cases}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      workflow: { ...settings.workflow, auto_assign_cases: checked },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="response_time">Domyślny czas odpowiedzi (godziny)</Label>
                <Input
                  id="response_time"
                  type="number"
                  value={settings.workflow.default_response_time}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      workflow: { ...settings.workflow, default_response_time: parseInt(e.target.value) },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ile godzin masz na pierwszą odpowiedź klientowi
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">System priorytetów spraw</p>
                  <p className="text-xs text-muted-foreground">
                    Używaj kolorów i oznaczeń dla spraw o różnych priorytetach
                  </p>
                </div>
                <Switch
                  checked={settings.workflow.case_priority_system}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      workflow: { ...settings.workflow, case_priority_system: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Wymagaj notatek w sprawie</p>
                  <p className="text-xs text-muted-foreground">
                    Zmuszaj do dodania notatki przy zmianie statusu sprawy
                  </p>
                </div>
                <Switch
                  checked={settings.workflow.require_case_notes}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      workflow: { ...settings.workflow, require_case_notes: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Automatyczne aktualizacje statusu</p>
                  <p className="text-xs text-muted-foreground">
                    System automatycznie aktualizuje status na podstawie działań
                  </p>
                </div>
                <Switch
                  checked={settings.workflow.auto_status_updates}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      workflow: { ...settings.workflow, auto_status_updates: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Bezpieczeństwo
              </CardTitle>
              <CardDescription>
                Zarządzaj bezpieczeństwem swojego konta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Uwierzytelnianie dwuskładnikowe</p>
                  <p className="text-xs text-muted-foreground">
                    Dodatkowa warstwa bezpieczeństwa dla Twojego konta
                  </p>
                </div>
                <Switch
                  checked={settings.security.two_factor_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, two_factor_enabled: checked },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="session_timeout">Timeout sesji (minuty)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  value={settings.security.session_timeout}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, session_timeout: parseInt(e.target.value) },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Po jakim czasie nieaktywności nastąpi wylogowanie
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Powiadomienia o logowaniu</p>
                  <p className="text-xs text-muted-foreground">
                    Otrzymuj email przy każdym logowaniu do systemu
                  </p>
                </div>
                <Switch
                  checked={settings.security.login_notifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, login_notifications: checked },
                    })
                  }
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Hasło</p>
                    <p className="text-xs text-muted-foreground">
                      Ostatnia zmiana: {new Date(settings.security.password_last_changed).toLocaleDateString("pl-PL")}
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleChangePassword}>
                    <Key className="h-4 w-4 mr-2" />
                    Zmień hasło
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Eksport danych</p>
                    <p className="text-xs text-muted-foreground">
                      Pobierz kopię wszystkich swoich danych
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleExportData}>
                    <Database className="h-4 w-4 mr-2" />
                    Eksportuj dane
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      Usuń konto
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ta akcja nie może być cofnięta. Wszystkie Twoje dane zostaną
                        trwale usunięte z naszych serwerów.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Anuluj</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600">
                        Usuń konto
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}