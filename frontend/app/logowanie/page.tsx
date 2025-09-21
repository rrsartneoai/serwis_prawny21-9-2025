"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth"; // Updated import
import { ArrowLeft, Mail, Eye, EyeOff, Phone, MessageSquare, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function LogowaniePage() {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone" | "email-code">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationSentTo, setVerificationSentTo] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { signInWithEmail, signInWithPhone, signInWithEmailCode, signInWithGoogle, verifyCode, pendingVerification } = useAuth();
  const router = useRouter();

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await signInWithEmail(email, password);

    if (result.error) {
      toast({
        title: "Błąd logowania",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.user) {
      if (result.requiresVerification) {
        setShowVerification(true);
        setCurrentUserId(result.user.id);
        setVerificationSentTo(result.verificationSentTo || "");
        toast({
          title: "Kod weryfikacyjny wysłany",
          description: `Sprawdź ${result.verificationSentTo}`,
        });
      } else {
        toast({
          title: "Zalogowano pomyślnie!",
          description: `Witaj z powrotem, ${result.user.name}!`,
        });
        router.push("/panel-klienta");
      }
    }
    setIsLoading(false);
  };

  const handlePhoneLogin = async () => {
    setIsLoading(true);
    
    const result = await signInWithPhone(phone);

    if (result.error) {
      toast({
        title: "Błąd logowania",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.user) {
      setShowVerification(true);
      setCurrentUserId(result.user.id);
      setVerificationSentTo(result.verificationSentTo || "");
      toast({
        title: "Kod SMS wysłany",
        description: `Sprawdź wiadomości na ${result.verificationSentTo}`,
      });
    }
    setIsLoading(false);
  };

  const handleEmailCodeLogin = async () => {
    setIsLoading(true);
    
    const result = await signInWithEmailCode(email);

    if (result.error) {
      toast({
        title: "Błąd logowania",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.user) {
      setShowVerification(true);
      setCurrentUserId(result.user.id);
      setVerificationSentTo(result.verificationSentTo || "");
      toast({
        title: "Kod weryfikacyjny wysłany",
        description: `Sprawdź email na ${result.verificationSentTo}`,
      });
    }
    setIsLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!currentUserId || !verificationCode) return;
    
    setIsLoading(true);
    const codeType = loginMethod === "phone" ? "sms" : "email";
    
    const result = await verifyCode(currentUserId, verificationCode, codeType);

    if (result.error) {
      toast({
        title: "Błąd weryfikacji",
        description: result.error,
        variant: "destructive",
      });
    } else if (result.user) {
      toast({
        title: "Logowanie pomyślne!",
        description: `Witaj ${result.user.name}!`,
      });
      router.push("/panel-klienta");
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const result = await signInWithGoogle();
    if (result.error) {
      toast({
        title: "Błąd logowania",
        description: result.error,
        variant: "destructive",
      });
      setIsLoading(false);
    }
    // If successful, user will be redirected to Google
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-montserrat">
      {/* USUWAM <Header /> */}

      <main className="flex-1 py-12">
        <div className="max-w-md mx-auto px-4">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót
            </Link>
          </Button>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Zaloguj się</CardTitle>
              <p className="text-gray-600">
                Uzyskaj dostęp do swojego panelu klienta
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Social Login */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Zaloguj przez Google
                </Button>

                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => toast({
                    title: "Funkcja w budowie",
                    description: "Logowanie przez Facebook zostanie wkrótce dodane.",
                  })}
                  disabled={isLoading}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Zaloguj przez Facebook
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Lub</span>
                </div>
              </div>

              {/* Login Method Selection */}
              {!showVerification && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    variant={loginMethod === "email" ? "default" : "outline"}
                    className="w-full justify-center"
                    onClick={() => setLoginMethod("email")}
                    disabled={isLoading}
                  >
                    <Mail className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Email + Hasło</span>
                    <span className="sm:hidden">Email</span>
                  </Button>
                  <Button
                    variant={loginMethod === "phone" ? "default" : "outline"}
                    className="w-full justify-center"
                    onClick={() => setLoginMethod("phone")}
                    disabled={isLoading}
                  >
                    <Phone className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span>SMS</span>
                  </Button>
                  <Button
                    variant={loginMethod === "email-code" ? "default" : "outline"}
                    className="w-full justify-center"
                    onClick={() => setLoginMethod("email-code")}
                    disabled={isLoading}
                  >
                    <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Kod Email</span>
                    <span className="sm:hidden">Kod</span>
                  </Button>
                </div>
              )}

              {/* Verification Code Form */}
              {showVerification && (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-medium text-blue-900">Kod weryfikacyjny</h3>
                    <p className="text-sm text-blue-700">
                      Wysłaliśmy kod na: {verificationSentTo}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="verification">Kod weryfikacyjny</Label>
                    <Input
                      id="verification"
                      type="text"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setShowVerification(false);
                        setVerificationCode("");
                        setCurrentUserId(null);
                      }}
                      disabled={isLoading}
                    >
                      Anuluj
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={handleVerifyCode}
                      disabled={isLoading || !verificationCode}
                    >
                      {isLoading ? "Weryfikacja..." : "Zweryfikuj"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Login Forms */}
              {!showVerification && (
                <>
                  {/* Email + Password Login */}
                  {loginMethod === "email" && (
                    <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Adres email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="twoj@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Hasło</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Wprowadź hasło"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Link
                          href="/zapomnialem-hasla"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Zapomniałeś hasła?
                        </Link>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Logowanie..." : "Zaloguj się"}
                      </Button>
                    </form>
                  )}

                  {/* Phone/SMS Login */}
                  {loginMethod === "phone" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Numer telefonu</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+48 123 456 789"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>

                      <Button 
                        className="w-full" 
                        onClick={handlePhoneLogin}
                        disabled={isLoading || !phone}
                      >
                        {isLoading ? "Wysyłanie SMS..." : "Wyślij kod SMS"}
                      </Button>
                    </div>
                  )}

                  {/* Email Code Login */}
                  {loginMethod === "email-code" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-code">Adres email</Label>
                        <Input
                          id="email-code"
                          type="email"
                          placeholder="twoj@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>

                      <Button 
                        className="w-full" 
                        onClick={handleEmailCodeLogin}
                        disabled={isLoading || !email}
                      >
                        {isLoading ? "Wysyłanie kodu..." : "Wyślij kod na email"}
                      </Button>
                    </div>
                  )}
                </>
              )}

              <div className="text-center">
                <span className="text-gray-600">Nie masz konta? </span>
                <Link
                  href="/rejestracja"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Zarejestruj się
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* USUWAM <Footer /> */}
    </div>
  );
}
