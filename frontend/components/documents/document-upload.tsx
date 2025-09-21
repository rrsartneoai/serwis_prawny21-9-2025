"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
} from "lucide-react";
import { documentsApi, DocumentResponse, FileUploadLimits } from "@/lib/api/documents";

interface DocumentUploadProps {
  caseId: number;
  onUploadSuccess?: (documents: DocumentResponse[]) => void;
  maxFiles?: number;
}

export default function DocumentUpload({ 
  caseId, 
  onUploadSuccess,
  maxFiles: propMaxFiles 
}: DocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [limits, setLimits] = useState<FileUploadLimits | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch upload limits when component mounts
    documentsApi.getUploadLimits().then(setLimits);
  }, []);

  const maxFiles = propMaxFiles || limits?.max_files_per_case || 10;
  const maxFileSize = (limits?.max_file_size_mb || 50) * 1024 * 1024; // Convert to bytes
  const allowedTypes = limits?.allowed_file_types || ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (['jpg', 'jpeg', 'png'].includes(ext || '')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-5 w-5 text-blue-600" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `Plik "${file.name}" przekracza maksymalny rozmiar ${limits?.max_file_size_mb || 50}MB`;
    }

    // Check file extension
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

    // Check total file count
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: "Za dużo plików",
        description: `Możesz przesłać maksymalnie ${maxFiles} plików na sprawę`,
        variant: "destructive",
      });
      return;
    }

    // Validate each file
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
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await documentsApi.uploadDocuments(caseId, files);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        toast({
          title: "Upload zakończony sukcesem",
          description: result.message,
        });

        // Clear files and notify parent
        setFiles([]);
        onUploadSuccess?.(result.documents);
      } else {
        toast({
          title: "Błąd uploadu",
          description: result.errors.join('. '),
          variant: "destructive",
        });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Dodaj dokumenty
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Limits Info */}
        {limits && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
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

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">
            Przeciągnij pliki tutaj lub kliknij aby wybrać
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Obsługiwane formaty: PDF, JPG, PNG, DOC, DOCX
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Wybierz pliki
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept={allowedTypes.map(ext => `.${ext}`).join(',')}
            onChange={(e) => e.target.files && handleFileChange(e.target.files)}
          />
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Wybrane pliki ({files.length}/{maxFiles}):</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.name)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Przesyłanie plików...</span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className="w-full"
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
      </CardContent>
    </Card>
  );
}