'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/');
    }
  }, [user, loading, router, mounted]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SQL Chat Assistant</h1>
              <p className="text-gray-600">AI-powered SQL help and database queries</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/invoices">
                <Button variant="outline">Invoices</Button>
              </Link>
              <Link href="/">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 h-[calc(100vh-120px)]">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                AI
              </span>
              SQL Chat Assistant
            </CardTitle>
          </CardHeader>
          <ChatInterface />
        </Card>
      </main>
    </div>
  );
}