'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Invoice } from '@/lib/types';

interface InvoiceListProps {
  invoices: Invoice[];
  onInvoiceDeleted: () => void;
}

export default function InvoiceList({ invoices, onInvoiceDeleted }: InvoiceListProps) {

  const [deleting, setDeleting] = useState<string | null>(null);

  const getStringField = (data: unknown, field: string): string | undefined => {
    if (data && typeof data === 'object' && field in data) {
      const value = (data as Record<string, unknown>)[field];
      return typeof value === 'string' ? value : undefined;
    }
    return undefined;
  };

  const renderInvoiceField = (
    data: unknown,
    field: string,
    expectedType: string,
    label: string,
    render: (value: unknown) => React.ReactNode
  ) => {
    if (!data || typeof data !== 'object' || !(field in data)) return null;
    
    const value = (data as Record<string, unknown>)[field];
    if (!value || typeof value !== expectedType) return null;

    return (
      <div>
        {label && <span className="text-gray-600">{label}</span>}
        {render(value)}
      </div>
    );
  };

  const handleDelete = async (invoiceId: string) => {
    try {
      setDeleting(invoiceId);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Invoice deleted successfully');
        onInvoiceDeleted();
      } else {
        toast.error('Failed to delete invoice');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-gray-400">📄</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices yet</h3>
        <p className="text-gray-600 mb-4">
          Upload your first invoice to get started with AI-powered data extraction.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <Card key={invoice.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="truncate">{invoice.original_filename}</span>
                  <Badge variant="outline">
                    {invoice.mime_type === 'application/pdf' ? 'PDF' : 'Image'}
                  </Badge>
                </CardTitle>
                <div className="text-sm text-gray-600 mt-1">
                  Uploaded {new Date(invoice.created_at).toLocaleDateString()} • {formatFileSize(invoice.file_size)}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"

                    >
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Invoice Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">File Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Filename:</span>
                            <div className="font-medium">{invoice.original_filename}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">File Size:</span>
                            <div className="font-medium">{formatFileSize(invoice.file_size)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Type:</span>
                            <div className="font-medium">{invoice.mime_type}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Uploaded:</span>
                            <div className="font-medium">
                              {new Date(invoice.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {invoice.extracted_data && (
                        <div>
                          <h4 className="font-semibold mb-2">Extracted Data</h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <pre className="text-sm whitespace-pre-wrap">
                              {JSON.stringify(invoice.extracted_data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deleting === invoice.id}
                    >
                      {deleting === invoice.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{invoice.original_filename}&quot;? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(invoice.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>

          {invoice.extracted_data && typeof invoice.extracted_data === 'object' && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {renderInvoiceField(invoice.extracted_data, 'amount', 'number', 'Amount:', (value: unknown) => (
                  <div className="font-semibold text-green-600">
                    {formatCurrency(
                      value as number,
                      getStringField(invoice.extracted_data, 'currency') || 'USD'
                    )}
                  </div>
                ))}
                
                {renderInvoiceField(invoice.extracted_data, 'vendor', 'string', 'Vendor:', (value: unknown) => (
                  <div className="font-medium">{value as string}</div>
                ))}
                
                {renderInvoiceField(invoice.extracted_data, 'date', 'string', 'Date:', (value: unknown) => (
                  <div className="font-medium">
                    {new Date(value as string).toLocaleDateString()}
                  </div>
                ))}
                
                {renderInvoiceField(invoice.extracted_data, 'invoice_number', 'string', 'Invoice #:', (value: unknown) => (
                  <div className="font-medium">{value as string}</div>
                ))}
              </div>
              
              {renderInvoiceField(invoice.extracted_data, 'description', 'string', '', (value: unknown) => (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-gray-600 text-sm">Description:</span>
                  <div className="text-sm mt-1">{value as string}</div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}