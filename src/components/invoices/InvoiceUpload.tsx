'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Invoice, UploadProgress } from '@/lib/types';

interface InvoiceUploadProps {
  onInvoiceUploaded: (invoice: Invoice) => void;
}

export default function InvoiceUpload({ onInvoiceUploaded }: InvoiceUploadProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const uploadFile = useCallback(async (file: File, uploadIndex: number) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex && upload.progress < 90
            ? { ...upload, progress: upload.progress + 10 }
            : upload
        ));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      if (result.success) {
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex 
            ? { ...upload, progress: 100, status: 'completed' }
            : upload
        ));

        onInvoiceUploaded(result.data);

        toast.success('Invoice uploaded successfully!', {
          description: `${file.name} has been processed and stored securely.`,
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploads(prev => prev.map((upload, idx) => 
        idx === uploadIndex 
          ? { 
              ...upload, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed' 
            }
          : upload
      ));

      toast.error(`Upload failed: ${file.name}`, {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  }, [onInvoiceUploaded]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setDragActive(false);

    const validFiles = acceptedFiles.filter(file => {
      const isValidType = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB max

      if (!isValidType) {
        toast.error(`Invalid file type: ${file.name}`, {
          description: 'Please upload PDF, PNG, or JPEG files only.',
        });
      }

      if (!isValidSize) {
        toast.error(`File too large: ${file.name}`, {
          description: 'Maximum file size is 10MB.',
        });
      }

      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) return;

    // Initialize upload progress
    const newUploads: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Upload files one by one
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const uploadIndex = uploads.length + i;

      try {
        await uploadFile(file, uploadIndex);
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex 
            ? { ...upload, status: 'error', error: 'Upload failed' }
            : upload
        ));
      }
    }
  }, [uploads.length, uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const clearCompleted = () => {
    setUploads(prev => prev.filter(upload => upload.status !== 'completed'));
  };

  return (
    <div className="space-y-6">
      {/* Upload Dropzone */}
      <Card className={`transition-all duration-200 ${
        isDragActive || dragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-dashed border-gray-300 hover:border-gray-400'
      }`}>
        <CardContent className="pt-6">
          <div {...getRootProps()} className="cursor-pointer">
            <input {...getInputProps()} />
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📄</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isDragActive ? 'Drop your files here' : 'Upload Invoice Files'}
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop invoice files here, or click to browse
              </p>
              <div className="flex justify-center gap-2 mb-4">
                <Badge variant="outline">PDF</Badge>
                <Badge variant="outline">PNG</Badge>
                <Badge variant="outline">JPEG</Badge>
              </div>
              <p className="text-sm text-gray-500">
                Maximum file size: 10MB per file
              </p>
              <Button className="mt-4">
                Choose Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Progress</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearCompleted}
                disabled={!uploads.some(upload => upload.status === 'completed')}
              >
                Clear Completed
              </Button>
            </div>
            <div className="space-y-4">
              {uploads.map((upload, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-xs">
                      {upload.file.name}
                    </span>
                    <Badge 
                      variant={
                        upload.status === 'completed' ? 'default' :
                        upload.status === 'error' ? 'destructive' : 'secondary'
                      }
                    >
                      {upload.status === 'uploading' ? 'Uploading' :
                       upload.status === 'processing' ? 'Processing' :
                       upload.status === 'completed' ? 'Completed' : 'Error'}
                    </Badge>
                  </div>
                  <Progress value={upload.progress} className="w-full" />
                  {upload.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{upload.error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="text-xs text-gray-500">
                    {(upload.file.size / 1024 / 1024).toFixed(2)} MB • {upload.file.type}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">AI Processing</h3>
          <p className="text-blue-800 text-sm">
            Once uploaded, our AI will automatically extract key information from your invoices including:
          </p>
          <ul className="text-blue-800 text-sm mt-2 space-y-1">
            <li>• Invoice amount and currency</li>
            <li>• Invoice date and due date</li>
            <li>• Vendor/company information</li>
            <li>• Invoice number and description</li>
            <li>• Tax amounts and line items</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}