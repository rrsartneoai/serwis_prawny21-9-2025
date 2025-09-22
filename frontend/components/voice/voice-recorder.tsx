"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Download,
  Upload,
  Volume2,
  Trash2,
  FileAudio,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";

interface VoiceRecorderProps {
  onTranscriptionComplete?: (transcription: string, audioBlob: Blob) => void;
  onRecordingComplete?: (audioBlob: Blob) => void;
  maxDuration?: number; // in seconds
  className?: string;
  showTranscription?: boolean;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
}

export default function VoiceRecorder({
  onTranscriptionComplete,
  onRecordingComplete,
  maxDuration = 300, // 5 minutes
  className = "",
  showTranscription = true
}: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    isPlaying: false,
    duration: 0,
    currentTime: 0
  });
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      toast({
        title: "Brak dostępu do mikrofonu",
        description: "Zezwól na dostęp do mikrofonu aby nagrać wiadomość głosową.",
        variant: "destructive",
      });
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) return;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        onRecordingComplete?.(blob);
        
        // Auto-transcribe if enabled
        if (showTranscription) {
          transcribeAudio(blob);
        }
      };

      mediaRecorder.start(250); // Collect data every 250ms
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0
      }));

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingState(prev => {
          const newDuration = prev.duration + 1;
          
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            stopRecording();
            return prev;
          }
          
          return { ...prev, duration: newDuration };
        });
      }, 1000);

      toast({
        title: "Nagrywanie rozpoczęte",
        description: "Mów teraz do mikrofonu. Nagranie zostanie automatycznie zatrzymane po 5 minutach.",
      });

    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Błąd nagrywania",
        description: "Nie udało się rozpocząć nagrywania. Sprawdź dostęp do mikrofonu.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false
      }));

      toast({
        title: "Nagrywanie zakończone",
        description: `Nagranie trwało ${formatTime(recordingState.duration)}.`,
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      if (recordingState.isPaused) {
        mediaRecorderRef.current.resume();
        
        // Resume timer
        timerRef.current = setInterval(() => {
          setRecordingState(prev => {
            const newDuration = prev.duration + 1;
            if (newDuration >= maxDuration) {
              stopRecording();
              return prev;
            }
            return { ...prev, duration: newDuration };
          });
        }, 1000);
        
        setRecordingState(prev => ({ ...prev, isPaused: false }));
      } else {
        mediaRecorderRef.current.pause();
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        setRecordingState(prev => ({ ...prev, isPaused: true }));
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (recordingState.isPlaying) {
        audioRef.current.pause();
        setRecordingState(prev => ({ ...prev, isPlaying: false }));
      } else {
        audioRef.current.play();
        setRecordingState(prev => ({ ...prev, isPlaying: true }));
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioUrl(null);
    setAudioBlob(null);
    setTranscription("");
    setTranscriptionError(null);
    setRecordingState({
      isRecording: false,
      isPaused: false,
      isPlaying: false,
      duration: 0,
      currentTime: 0
    });

    toast({
      title: "Nagranie usunięte",
      description: "Możesz rozpocząć nowe nagranie.",
    });
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    setTranscriptionError(null);
    
    try {
      // Here you would integrate with a real speech-to-text service
      // For demo purposes, we'll simulate the transcription
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const simulatedTranscription = `To jest przykładowa transkrypcja nagrania. 
Użytkownik opisuje swoją sytuację prawną i oczekiwania dotyczące analizy dokumentów. 
Nagranie zostało pomyślnie przetworzone na tekst.`;
      
      setTranscription(simulatedTranscription);
      onTranscriptionComplete?.(simulatedTranscription, blob);
      
      toast({
        title: "Transkrypcja ukończona",
        description: "Nagranie zostało przetworzone na tekst.",
      });
      
    } catch (error) {
      console.error("Transcription error:", error);
      setTranscriptionError("Nie udało się przetworzyć nagrania na tekst.");
      toast({
        title: "Błąd transkrypcji",
        description: "Nie udało się przetworzyć nagrania na tekst. Spróbuj ponownie.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const downloadAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nagranie-${new Date().toISOString().slice(0, 19)}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingStatusColor = () => {
    if (recordingState.isRecording) {
      return recordingState.isPaused ? "text-yellow-600" : "text-red-600";
    }
    return "text-gray-600";
  };

  const getRecordingStatusText = () => {
    if (recordingState.isRecording) {
      return recordingState.isPaused ? "Nagrywanie wstrzymane" : "Nagrywanie...";
    }
    return "Gotowy do nagrania";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Nagranie głosowe
          <Badge 
            variant="outline" 
            className={`ml-auto ${getRecordingStatusColor()}`}
          >
            {getRecordingStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-center space-x-3">
          {!recordingState.isRecording ? (
            <Button
              onClick={startRecording}
              disabled={recordingState.isRecording}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <Mic className="h-4 w-4" />
              Rozpocznij nagrywanie
            </Button>
          ) : (
            <>
              <Button
                onClick={pauseRecording}
                variant="outline"
                className="flex items-center gap-2"
              >
                {recordingState.isPaused ? (
                  <>
                    <Play className="h-4 w-4" />
                    Wznów
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    Wstrzymaj
                  </>
                )}
              </Button>
              
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Zatrzymaj
              </Button>
            </>
          )}
        </div>

        {/* Recording Duration */}
        <div className="text-center">
          <div className="text-2xl font-mono font-bold">
            {formatTime(recordingState.duration)}
          </div>
          <div className="text-sm text-muted-foreground">
            Maksymalnie {formatTime(maxDuration)}
          </div>
          
          {recordingState.isRecording && (
            <Progress 
              value={(recordingState.duration / maxDuration) * 100} 
              className="mt-2" 
            />
          )}
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-3">
              <Button
                onClick={playAudio}
                variant="outline"
                className="flex items-center gap-2"
              >
                {recordingState.isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Zatrzymaj
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Odtwórz
                  </>
                )}
              </Button>
              
              <Button
                onClick={downloadAudio}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Pobierz
              </Button>
              
              <Button
                onClick={deleteRecording}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Usuń
              </Button>
            </div>

            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setRecordingState(prev => ({ ...prev, isPlaying: false }))}
              onTimeUpdate={() => {
                if (audioRef.current) {
                  setRecordingState(prev => ({
                    ...prev,
                    currentTime: Math.floor(audioRef.current?.currentTime || 0)
                  }));
                }
              }}
              className="w-full"
              controls
            />
          </div>
        )}

        {/* Transcription */}
        {showTranscription && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileAudio className="h-4 w-4" />
              <span className="font-medium">Transkrypcja</span>
              {isTranscribing && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              )}
            </div>
            
            {isTranscribing ? (
              <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Przetwarzanie nagrania na tekst...</span>
              </div>
            ) : transcriptionError ? (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{transcriptionError}</span>
                <Button
                  onClick={() => audioBlob && transcribeAudio(audioBlob)}
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                >
                  Spróbuj ponownie
                </Button>
              </div>
            ) : transcription ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Transkrypcja ukończona</span>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{transcription}</p>
                </div>
              </div>
            ) : audioBlob ? (
              <div className="text-center">
                <Button
                  onClick={() => transcribeAudio(audioBlob)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Przeprowadź transkrypcję
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Kliknij "Rozpocznij nagrywanie" aby rozpocząć</p>
          <p>• Możesz wstrzymać i wznowić nagrywanie</p>
          <p>• Nagranie zostanie automatycznie transkrybowane na tekst</p>
          <p>• Maksymalny czas nagrania: {formatTime(maxDuration)}</p>
        </div>
      </CardContent>
    </Card>
  );
}