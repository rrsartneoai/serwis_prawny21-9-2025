"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { casesApi, type Case } from "@/lib/api/cases";
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  Loader2,
  FileText,
  Clock
} from "lucide-react";

export default function PlatnoscPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
  const caseId = searchParams.get('caseId');
  const amount = searchParams.get('amount');
  
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'PAYU' | 'STRIPE' | 'BANK_TRANSFER' | 'PAYPAL'>('PAYU');
  const [processing, setProcessing] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/logowanie');
      return;
    }
  }, [isAuthenticated, router]);

  // Load case data
  useEffect(() => {
    const loadCaseData = async () => {
      if (!caseId) {
        setError('Brak ID sprawy w parametrach');
        setLoading(false);
        return;
      }

      try {
        const result = await casesApi.getCase(parseInt(caseId));
        if (result.error) {
          setError(result.error);
        } else if (result.case) {
          setCaseData(result.case);
        }
      } catch (err) {
        setError('Błąd podczas ładowania danych sprawy');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && caseId) {
      loadCaseData();
    }
  }, [isAuthenticated, caseId]);

  const handlePayment = async () => {
    if (!caseData || !amount) return;
    
    setProcessing(true);
    
    try {
      // Create payment via API
      const { paymentsApi } = await import("@/lib/api/payments");
      
      // Get promo code from localStorage if available
      const appliedPromoCode = localStorage.getItem('appliedPromoCode');
      
      const paymentResult = await paymentsApi.createPayment({
        case_id: caseData.id,
        amount: parseFloat(amount),
        payment_type: 'analysis',
        provider: paymentMethod,
        description: `Analiza dokumentów - sprawa #${caseData.id}`,
        promo_code: appliedPromoCode || undefined
      });

      if (paymentResult.error) {
        alert(`Błąd tworzenia płatności: ${paymentResult.error}`);
        return;
      }

      if (paymentResult.payment) {
        // Simulate payment success (for development)
        const simulateResult = await paymentsApi.simulatePaymentSuccess(paymentResult.payment.id);
        
        if (simulateResult.error) {
          alert(`Błąd podczas symulacji płatności: ${simulateResult.error}`);
          return;
        }

        // Clear stored promo code after successful payment
        localStorage.removeItem('appliedPromoCode');
        localStorage.removeItem('pendingCaseId');
        
        // Show success and redirect
        alert('Płatność zakończona pomyślnie! Przekierowanie do panelu klienta...');
        router.push('/panel-klienta');
      }
      
    } catch (error) {
      alert(`Błąd podczas przetwarzania płatności: ${error instanceof Error ? error.message : 'Nieznany błąd'}`);
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Sprawdzanie autoryzacji...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Ładowanie danych płatności...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <div className="text-red-600 mb-4">
                <Shield className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-xl font-bold mb-2">Błąd</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/zamow-analize')}>
                Powrót do zamówienia
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-montserrat">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Podsumowanie zamówienia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{caseData.title || caseData.name}</h3>
                      <p className="text-sm text-gray-600">
                        Pakiet: {caseData.package_type || 'standard'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Dokumenty: {caseData.documents.length} plik(ów)
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      Nowa sprawa
                    </Badge>
                  </div>

                  {/* Documents list */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Przesłane dokumenty:</h4>
                    <div className="space-y-2">
                      {caseData.documents.map((doc, index) => (
                        <div key={doc.id} className="flex items-center text-sm">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{doc.name}</span>
                          <span className="ml-auto text-gray-500">
                            {(doc.size / 1024 / 1024).toFixed(1)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  {caseData.description && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Opis sprawy:</h4>
                      <p className="text-sm text-gray-600">{caseData.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Wybierz metodę płatności
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${{
                        'PAYU': 'border-blue-500 bg-blue-50',
                        'default': 'border-gray-200 hover:border-gray-300'
                      }[paymentMethod === 'PAYU' ? 'PAYU' : 'default']}`}
                      onClick={() => setPaymentMethod('PAYU')}
                    >
                      <div className="font-medium">PayU</div>
                      <div className="text-sm text-gray-600">
                        Szybkie płatności online
                      </div>
                      <Badge className="mt-2 bg-green-100 text-green-800">
                        Popularne w Polsce
                      </Badge>
                    </div>

                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${{
                        'STRIPE': 'border-blue-500 bg-blue-50',
                        'default': 'border-gray-200 hover:border-gray-300'
                      }[paymentMethod === 'STRIPE' ? 'STRIPE' : 'default']}`}
                      onClick={() => setPaymentMethod('STRIPE')}
                    >
                      <div className="font-medium">Karta płatnicza</div>
                      <div className="text-sm text-gray-600">
                        Visa, Mastercard, BLIK
                      </div>
                    </div>

                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${{
                        'BANK_TRANSFER': 'border-blue-500 bg-blue-50',
                        'default': 'border-gray-200 hover:border-gray-300'
                      }[paymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'default']}`}
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    >
                      <div className="font-medium">Przelew internetowy</div>
                      <div className="text-sm text-gray-600">
                        23 banki
                      </div>
                    </div>

                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${{
                        'PAYPAL': 'border-blue-500 bg-blue-50',
                        'default': 'border-gray-200 hover:border-gray-300'
                      }[paymentMethod === 'PAYPAL' ? 'PAYPAL' : 'default']}`}
                      onClick={() => setPaymentMethod('PAYPAL')}
                    >
                      <div className="font-medium">PayPal</div>
                      <div className="text-sm text-gray-600">
                        Płatność bezpieczna
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Podsumowanie płatności</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Analiza dokumentów</span>
                    <span>{amount} zł</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>VAT (23%)</span>
                    <span>Wliczone w cenę</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Do zapłaty</span>
                      <span>{amount} zł</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-6" 
                    onClick={handlePayment}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Przetwarzanie...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Zapłać {amount} zł
                      </>
                    )}
                  </Button>

                  <div className="text-center text-sm text-gray-600 mt-4">
                    <Shield className="h-4 w-4 inline mr-1" />
                    Bezpieczna płatność SSL
                  </div>
                </CardContent>
              </Card>

              {/* What happens next */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Co dzieje się dalej?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Otrzymasz potwierdzenie na email</span>
                  </div>
                  <div className="flex items-start">
                    <Clock className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Prawnik przystąpi do analizy dokumentów</span>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Powiadomimy Cię SMS-em gdy analiza będzie gotowa</span>
                  </div>
                  <div className="flex items-start">
                    <FileText className="h-4 w-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Analizę otrzymasz w panelu klienta i na email</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}