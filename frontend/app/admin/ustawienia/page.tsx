"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Save } from "lucide-react";

interface AdminSettings {
  analyticsPublic: boolean;
  emailFrom: string;
  enablePayments: boolean;
  notifyOnUserCreate: boolean;
}

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>({
    analyticsPublic: false,
    emailFrom: "noreply@kancelariax.pl",
    enablePayments: true,
    notifyOnUserCreate: true,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin-settings");
      if (raw) setSettings(JSON.parse(raw));
    } catch {}
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      localStorage.setItem("admin-settings", JSON.stringify(settings));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ustawienia (Admin)</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4 mr-2"/>Odśwież</Button>
          <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-2"/>{saving ? "Zapisywanie…" : "Zapisz"}</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Ogólne</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Udostępniaj widok analityki</Label>
              <p className="text-xs text-muted-foreground">Pozwala na publiczny podgląd metryk.</p>
            </div>
            <Switch checked={settings.analyticsPublic} onCheckedChange={(c)=>setSettings({...settings, analyticsPublic: Boolean(c)})} />
          </div>
          <div>
            <Label htmlFor="emailFrom">Adres nadawcy e‑mail</Label>
            <Input id="emailFrom" value={settings.emailFrom} onChange={(e)=>setSettings({...settings, emailFrom: e.target.value})} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Włącz płatności</Label>
              <p className="text-xs text-muted-foreground">Zezwalaj na nowe transakcje.</p>
            </div>
            <Switch checked={settings.enablePayments} onCheckedChange={(c)=>setSettings({...settings, enablePayments: Boolean(c)})} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Powiadom o nowym użytkowniku</Label>
              <p className="text-xs text-muted-foreground">Wysyłaj alerty administratorom.</p>
            </div>
            <Switch checked={settings.notifyOnUserCreate} onCheckedChange={(c)=>setSettings({...settings, notifyOnUserCreate: Boolean(c)})} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 