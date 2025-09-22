"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Star } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

export default function CennikPage() {
  const [selectedPlan, setSelectedPlan] = useState<null | { name: string; price: string }>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"terms" | "payment" | "summary">("terms");
  const [accepted, setAccepted] = useState(false);
  const [payment, setPayment] = useState("card");
  const [orderId, setOrderId] = useState<string | null>(null);

  const plans = [
    { name: "Basic", price: "39", period: "PLN za analizę", description: "Podstawowa analiza dokumentów prawnych z wykorzystaniem AI", features: ["Analiza jednego dokumentu","Rozpoznawanie tekstu (OCR)","Podstawowa analiza prawna AI","Identyfikacja kluczowych elementów","Wyciągi w języku polskim","Wsparcie e-mail","Czas realizacji: 24-48h"], notIncluded: ["Szczegółowa analiza ryzyka","Rekomendacje prawne","Wsparcie telefoniczne","Express realizacja"], popular: false },
    { name: "Standard", price: "59", period: "PLN za analizę", description: "Rozszerzona analiza dokumentów z szczegółową oceną prawną", features: ["Wszystko z pakietu Basic","Szczegółowa analiza ryzyka","Identyfikacja problemów prawnych","Podstawowe rekomendacje","Analiza zgodności z przepisami","Wsparcie e-mail i telefon","Czas realizacji: 12-24h"], notIncluded: ["Kompleksowe rekomendacje prawne","Przegląd przez prawnika","Express realizacja (6h)"], popular: true },
    { name: "Premium", price: "89", period: "PLN za analizę", description: "Kompleksowa analiza z profesjonalną oceną prawną", features: ["Wszystko z pakietu Standard","Kompleksowe rekomendacje prawne","Analiza precedensów prawnych","Ocena skutków prawnych","Sugestie działań naprawczych","Priorytetowe wsparcie","Czas realizacji: 6-12h"], notIncluded: ["Przegląd przez prawnika","Bezpośrednie konsultacje","Super express (3h)"], popular: false },
    { name: "Express", price: "129", period: "PLN za analizę", description: "Najszybsza analiza dokumentów z priorytetem realizacji", features: ["Wszystko z pakietu Premium","Express realizacja w 6h","Priorytetowa obsługa","Dedykowany operator","Wsparcie telefoniczne 24/7","Powiadomienia SMS","Gwarancja terminowości"], notIncluded: ["Przegląd przez prawnika","Bezpośrednie konsultacje prawne"], popular: false },
    { name: "Business", price: "199", period: "PLN za analizę", description: "Pakiet biznesowy z przeglądem prawnika i konsultacjami", features: ["Wszystko z pakietu Express","Przegląd przez wykwalifikowanego prawnika","30 min konsultacji telefonicznej","Analiza wielodokumentowa","Rekomendacje biznesowe","Dedykowany prawnik","Priorytet VIP","Realizacja w 3-6h"], notIncluded: [], popular: false },
  ];

  const startFlow = (plan: { name: string; price: string }) => {
    setSelectedPlan(plan);
    setAccepted(false);
    setPayment("card");
    setStep("terms");
    setOpen(true);
  };

  const confirmTerms = () => {
    if (!accepted) return;
    setStep("payment");
  };

  const pay = () => {
    // Mock payment and persist purchase for demo/statistics
    const id = `ORD-${Date.now()}`;
    setOrderId(id);
    try {
      const historyKey = "demo-purchases";
      const raw = localStorage.getItem(historyKey);
      const arr = raw ? JSON.parse(raw) as any[] : [];
      arr.push({ id, plan: selectedPlan?.name, amount: Number(selectedPlan?.price || 0), method: payment, created_at: new Date().toISOString() });
      localStorage.setItem(historyKey, JSON.stringify(arr));
    } catch {}
    setStep("summary");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pricing Plans */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? "ring-2 ring-blue-500 scale-105" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      <Star className="w-4 h-4 mr-1" />
                      Najpopularniejszy
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-blue-600">{plan.price}</span>
                    <span className="text-gray-600 ml-2">PLN {plan.period}</span>
                  </div>
                  <p className="text-gray-600 mt-4">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((feature, idx) => (
                      <div key={idx} className="flex items-start opacity-50">
                        <X className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6">
                    <Button className={`w-full ${plan.popular ? "bg-blue-600 hover:bg-blue-700" : ""}`} variant={plan.popular ? "default" : "outline"} onClick={() => startFlow({ name: plan.name, price: plan.price })}>
                      Wybierz pakiet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Flow dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          {step === "terms" && (
            <>
              <DialogHeader>
                <DialogTitle>Akceptacja warunków</DialogTitle>
                <DialogDescription>
                  Przed kontynuacją prosimy o akceptację regulaminu i polityki płatności.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-md text-sm">
                  Wybrany plan: <strong>{selectedPlan?.name}</strong> – {selectedPlan?.price} PLN
                </div>
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox checked={accepted} onCheckedChange={(c) => setAccepted(Boolean(c))} />
                  <span>
                    Akceptuję regulamin, politykę prywatności oraz warunki świadczenia usług.
                  </span>
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Anuluj</Button>
                <Button onClick={confirmTerms} disabled={!accepted}>Przejdź do płatności</Button>
              </DialogFooter>
            </>
          )}

          {step === "payment" && (
            <>
              <DialogHeader>
                <DialogTitle>Wybór metody płatności</DialogTitle>
                <DialogDescription>
                  Kwota do zapłaty: <strong>{selectedPlan?.price} PLN</strong>
                </DialogDescription>
              </DialogHeader>
              <RadioGroup value={payment} onValueChange={setPayment} className="space-y-3">
                <div className="flex items-center space-x-2 p-3 border rounded-md">
                  <RadioGroupItem value="card" id="pay-card" />
                  <Label htmlFor="pay-card">Karta płatnicza</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-md">
                  <RadioGroupItem value="blik" id="pay-blik" />
                  <Label htmlFor="pay-blik">BLIK</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-md">
                  <RadioGroupItem value="transfer" id="pay-transfer" />
                  <Label htmlFor="pay-transfer">Szybki przelew</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-md">
                  <RadioGroupItem value="paypal" id="pay-paypal" />
                  <Label htmlFor="pay-paypal">PayPal</Label>
                </div>
              </RadioGroup>
              <Separator className="my-2" />
              <div className="text-xs text-gray-500">To demo płatności. Transakcja nie zostanie obciążona.</div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("terms")}>Wstecz</Button>
                <Button onClick={pay}>Zapłać</Button>
              </DialogFooter>
            </>
          )}

          {step === "summary" && (
            <>
              <DialogHeader>
                <DialogTitle>Podsumowanie zamówienia</DialogTitle>
                <DialogDescription>Twoja płatność została zarejestrowana.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm">Numer zamówienia: <strong>{orderId}</strong></p>
                  <p className="text-sm">Plan: <strong>{selectedPlan?.name}</strong></p>
                  <p className="text-sm">Kwota: <strong>{selectedPlan?.price} PLN</strong></p>
                  <p className="text-sm">Metoda płatności: <strong>{payment.toUpperCase()}</strong></p>
                </div>
                <p className="text-sm text-gray-600">Szczegóły zamówienia znajdziesz w swoim panelu. Wysłaliśmy również potwierdzenie na e-mail.</p>
              </div>
              <DialogFooter>
                <Button onClick={() => setOpen(false)}>Zamknij</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
