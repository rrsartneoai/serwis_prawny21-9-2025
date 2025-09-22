"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  Upload,
  FileText,
  ImageIcon,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  File,
  Camera,
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Volume2,
} from "lucide-react";
import { documentsApi, DocumentResponse, FileUploadLimits } from "@/lib/api/documents";

interface EnhancedDocumentUploadProps {
  caseId?: number;
  onUploadSuccess?: (documents: DocumentResponse[]) => void;
  onCaseCreated?: (caseId: number) => void;
  maxFiles?: number;
  showCaseDetails?: boolean;
}

interface CaseFormData {
  title: string;
  description: string;
  userExpectation: string;
  voiceTranscription?: string;
}

export default function EnhancedDocumentUpload({ 
  caseId, 
  onUploadSuccess,
  onCaseCreated,
  maxFiles: propMaxFiles,
  showCaseDetails = false
}: EnhancedDocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [limits, setLimits] = useState<FileUploadLimits | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Case creation form data
  const [caseData, setCaseData] = useState<CaseFormData>({
    title: "",
    description: "",
    userExpectation: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    documentsApi.getUploadLimits().then(setLimits);
  }, []);

  const maxFiles = propMaxFiles || limits?.max_files_per_case || 10;
  const maxFileSize = (limits?.max_file_size_mb || 50) * 1024 * 1024;
  const allowedTypes = limits?.allowed_file_types || ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];

  const documentTypes = [
    { name: "Nakaz zapłaty", description: "Sądowy nakaz zapłaty", icon: "⚖️" },
    { name: "Wezwanie komornika", description: "Wezwanie do zapłaty od komornika", icon: "📋" },
    { name: "Pozew sądowy", description: "Pozew do sądu cywilnego", icon: "🏛️" },
    { name: "Upomnienie", description: "Upomnienie przedsądowe", icon: "⚠️" },
    { name: "Umowa", description: "Umowa cywilnoprawna", icon: "📝" },
    { name: "Inne", description: "Inny dokument prawny", icon: "📄" },
  ];

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-5 w-5 text-blue-600" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `Plik "${file.name}" przekracza maksymalny rozmiar ${limits?.max_file_size_mb || 50}MB`;
    }

    const ext = file.name.toLowerCase().split('.').pop();
    if (!ext || !allowedTypes.includes(ext)) {
      return `Nieprawidłowe rozszerzenie "${ext}". Dozwolone: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileChange = (selectedFiles: FileList) => {
    const newFiles = Array.from(selectedFiles);
    const validFiles: File[] = [];
    const errors: string[] = [];

    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: "Za dużo plików",
        description: `Możesz przesłać maksymalnie ${maxFiles} plików na sprawę`,
        variant: "destructive",
      });
      return;
    }

    newFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "Błędy walidacji plików",
        description: errors.join('. '),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Camera functionality
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      toast({
        title: "Błąd kamery",
        description: "Nie można uzyskać dostępu do kamery. Sprawdź uprawnienia.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `document-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const error = validateFile(file);
            if (error) {
              toast({
                title: "Błąd walidacji",
                description: error,
                variant: "destructive",
              });
            } else {
              setFiles(prev => [...prev, file]);
              stopCamera();
              toast({
                title: "Zdjęcie dodane",
                description: "Zdjęcie zostało pomyślnie dodane do dokumentów.",
              });
            }
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // Voice recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Błąd nagrywania",
        description: "Nie można uzyskać dostępu do mikrofonu. Sprawdź uprawnienia.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      // Here you would integrate with a speech-to-text service
      // For now, we'll simulate transcription
      setTimeout(() => {
        const simulatedTranscription = "To jest przykładowa transkrypcja nagrania głosowego użytkownika.";
        setCaseData(prev => ({
          ...prev,
          voiceTranscription: simulatedTranscription,
          userExpectation: prev.userExpectation + (prev.userExpectation ? ' ' : '') + simulatedTranscription
        }));
        setIsTranscribing(false);
        toast({
          title: "Transkrypcja ukończona",
          description: "Nagranie zostało przetworzone na tekst.",
        });
      }, 2000);
    } catch (error) {
      setIsTranscribing(false);
      toast({
        title: "Błąd transkrypcji",
        description: "Nie można przetworzyć nagrania na tekst.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "Brak plików",
        description: "Wybierz pliki do przesłania",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      let targetCaseId = caseId;
      
      // If no caseId provided, create new case first
      if (!targetCaseId && showCaseDetails) {
        const caseResponse = await fetch('/api/v1/cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: caseData.title,
            description: caseData.description,
            client_notes: caseData.userExpectation,
            document_type: caseData.title,
          }),
        });
        
        if (!caseResponse.ok) throw new Error('Failed to create case');
        const newCase = await caseResponse.json();
        targetCaseId = newCase.id;
        onCaseCreated?.(targetCaseId);
      }

      if (targetCaseId) {
        const result = await documentsApi.uploadDocuments(targetCaseId, files);
        
        clearInterval(progressInterval);
        setUploadProgress(100);

        if (result.success) {
          toast({
            title: "Upload zakończony sukcesem",
            description: result.message,
          });

          setFiles([]);
          onUploadSuccess?.(result.documents);
          setCurrentStep(3); // Move to analysis step
        } else {
          toast({
            title: "Błąd uploadu",
            description: result.errors.join('. '),
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Błąd uploadu",
        description: error instanceof Error ? error.message : "Nieznany błąd",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderDocumentUploadStep();
      case 2:
        return renderDescriptionStep();
      case 3:
        return renderAnalysisStep();
      default:
        return renderDocumentUploadStep();
    }
  };

  const renderDocumentUploadStep = () => (
    <>
      {/* Document Type Selection */}
      {showCaseDetails && (
        <div className="space-y-4 mb-6">
          <Label className="text-base font-semibold">1. Wybierz rodzaj dokumentu *</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {documentTypes.map((type, index) => (
              <Button
                key={index}
                type="button"
                variant={caseData.title === type.name ? "default" : "outline"}
                onClick={() => setCaseData({ ...caseData, title: type.name })}
                className="flex flex-col h-auto py-4 px-3 text-center hover:scale-105 transition-transform"
              >
                <span className="text-2xl mb-2">{type.icon}</span>
                <span className="font-medium text-sm">{type.name}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {type.description}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Upload Limits Info */}
      {limits && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md mb-4">
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Limity:</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>Maksymalnie {limits.max_files_per_case} plików na sprawę</li>
            <li>Maksymalny rozmiar pliku: {limits.max_file_size_mb}MB</li>
            <li>Dozwolone formaty: {limits.allowed_file_types.map(t => t.toUpperCase()).join(', ')}</li>
          </ul>
        </div>
      )}

      {/* Enhanced Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">
          Przeciągnij pliki tutaj lub użyj opcji poniżej
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Obsługiwane formaty: PDF, JPG, PNG, DOC, DOCX
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Wybierz pliki
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={startCamera}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Zrób zdjęcie
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept={allowedTypes.map(ext => `.${ext}`).join(',')}
          onChange={(e) => e.target.files && handleFileChange(e.target.files)}
        />
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Zrób zdjęcie dokumentu</h3>
              <Button variant="ghost" size="sm" onClick={stopCamera}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Zrób zdjęcie
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                Anuluj
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-2 mt-6">
          <h4 className="font-medium">Wybrane pliki ({files.length}/{maxFiles}):</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-md"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file.name)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2 mt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Przesyłanie plików...</span>
            <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        {showCaseDetails && files.length > 0 && (
          <Button
            onClick={() => setCurrentStep(2)}
            disabled={!caseData.title}
            className="flex-1"
          >
            Dalej: Opis sprawy
          </Button>
        )}
        
        {!showCaseDetails && (
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Przesyłanie...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Prześlij dokumenty ({files.length})
              </>
            )}
          </Button>
        )}
      </div>
    </>
  );

  const renderDescriptionStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">2. Opisz swoją sytuację</h3>
        <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
          Wróć
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="description">Krótki opis sprawy</Label>
          <Textarea
            id="description"
            value={caseData.description}
            onChange={(e) => setCaseData({ ...caseData, description: e.target.value })}
            placeholder="Opisz krótko swoją sytuację prawną..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="userExpectation">Czego oczekujesz od analizy?</Label>
          <Textarea
            id="userExpectation"
            value={caseData.userExpectation}
            onChange={(e) => setCaseData({ ...caseData, userExpectation: e.target.value })}
            placeholder="Np. chcę wiedzieć czy dokument jest ważny, jakie mam opcje, czy powinienem zapłacić..."
            rows={4}
          />
        </div>

        {/* Voice Recording */}
        <div className="border rounded-lg p-4">
          <Label className="text-base font-medium mb-3 block">
            Opcjonalnie: Nagraj opis głosowo (max 2 minuty)
          </Label>
          
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <Button
                type="button"
                variant="outline"
                onClick={startRecording}
                disabled={isTranscribing}
                className="flex items-center gap-2"
              >
                <Mic className="h-4 w-4" />
                Rozpocznij nagrywanie
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                onClick={stopRecording}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Zakończ nagrywanie
              </Button>
            )}

            {isTranscribing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Przetwarzanie nagrania...
              </div>
            )}
          </div>

          {audioUrl && (
            <div className="mt-3">
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}

          {caseData.voiceTranscription && (
            <div className="mt-3 p-3 bg-muted rounded">
              <Label className="text-sm font-medium">Transkrypcja:</Label>
              <p className="text-sm mt-1">{caseData.voiceTranscription}</p>
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={handleUpload}
        disabled={isUploading || !caseData.description.trim()}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Tworzenie sprawy...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Utwórz sprawę i rozpocznij analizę
          </>
        )}
      </Button>
    </div>
  );

  const renderAnalysisStep = () => (
    <div className="text-center space-y-4">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h3 className="text-lg font-semibold">Sprawa utworzona pomyślnie!</h3>
      <p className="text-muted-foreground">
        Dokumenty zostały przesłane i rozpoczynamy analizę. Otrzymasz powiadomienie gdy analiza będzie gotowa.
      </p>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {showCaseDetails ? 'Nowa sprawa prawna' : 'Dodaj dokumenty'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderStepContent()}
      </CardContent>
    </Card>
  );
}