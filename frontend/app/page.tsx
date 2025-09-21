"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  Shield,
  CheckCircle,
  Upload,
  Star,
  ArrowRight,
  Users,
  Award,
  Phone,
  Mail,
  MapPin,
  Scale,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const services = [
    {
      title: "Analiza Nakazu Zapłaty",
      description: "Sprawdzimy czy nakaz zapłaty jest prawidłowy i podpowiemy jak się bronić",
      price: "49 zł",
      icon: FileText,
      popular: true,
    },
    {
      title: "Odpowiedź na Wezwanie Komornika",
      description: "Przygotujemy profesjonalną odpowiedź na działania komornicze",
      price: "79 zł",
      icon: Shield,
      popular: false,
    },
    {
      title: "Skarga na Czynność Komornika",
      description: "Zaskarżymy nieprawidłowe działania komornika sądowego",
      price: "99 zł",
      icon: FileText,
      popular: false,
    },
    {
      title: "Sprzeciw od Nakazu Zapłaty",
      description: "Złożymy sprzeciw w odpowiednim terminie z uzasadnieniem",
      price: "89 zł",
      icon: Clock,
      popular: false,
    },
  ];

  const stats = [
    { value: "2500+", label: "Przeanalizowanych dokumentów", icon: FileText },
    { value: "1200+", label: "Zadowolonych klientów", icon: Users },
    { value: "24h", label: "Średni czas realizacji", icon: Clock },
    { value: "98%", label: "Skuteczność naszych pism", icon: Award },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-montserrat">
      <main className="flex-1">
        {/* Hero Section */}
        <section id="home" className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="bg-blue-800 text-blue-100 mb-4 font-medium">
                  PROFESJONALNA POMOC PRAWNA
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  Otrzymałeś pismo prawne?
                  <span className="text-blue-200"> Pomożemy Ci!</span>
                </h1>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Analizujemy dokumenty prawne i przygotowujemy odpowiedzi w
                  ciągu 24 godzin. Profesjonalnie, szybko i w przystępnej cenie.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                    asChild
                  >
                    <Link href="/zamow-analize">
                      <Upload className="mr-2 h-5 w-5" />
                      Zamów Analizę
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent font-semibold"
                    asChild
                  >
                    <Link href="/jak-to-dziala">Zobacz Przykłady</Link>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <h3 className="text-2xl font-bold mb-4 text-center">
                    Express Analysis
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Analiza w 24h</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Profesjonalna odpowiedź</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-300" />
                      <span>Przystępne ceny</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Nasze Usługi
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Oferujemy kompleksową pomoc prawną w sprawach związanych z
                dokumentami sądowymi i komorniczymi
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <Card
                    key={index}
                    className={`relative h-full hover:shadow-lg transition-shadow ${
                      service.popular ? "border-blue-500 border-2" : ""
                    }`}
                  >
                    {service.popular && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                        Najpopularniejsze
                      </Badge>
                    )}
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                        <IconComponent className="h-6 w-6 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg font-semibold">
                        {service.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-600 mb-4 text-sm">
                        {service.description}
                      </p>
                      <div className="text-2xl font-bold text-blue-600 mb-4">
                        {service.price}
                      </div>
                      <Button className="w-full" asChild>
                        <Link href="/zamow-analize">
                          Zamów teraz
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                      <IconComponent className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {stat.value}
                    </div>
                    <div className="text-gray-600">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Gotowy na Profesjonalną Pomoc?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Nie czekaj - każdy dzień zwłoki może mieć znaczenie prawne. Zamów
              analizę już dziś!
            </p>
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              asChild
            >
              <Link href="/zamow-analize">
                <Upload className="mr-2 h-5 w-5" />
                Zamów Analizę Teraz
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}