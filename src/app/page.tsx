'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import LoginForm from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SQL Chat GPT-3 Chatboard
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI-powered SQL assistance with intelligent invoice processing. 
            Chat with GPT-3, execute SQL queries, and manage your invoices seamlessly.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold">💬</span>
                </div>
                AI SQL Chat
              </CardTitle>
              <CardDescription>
                Get instant help with SQL queries, database design, and data analysis using GPT-3
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/chat">
                <Button className="w-full">
                  Start Chatting
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold">📄</span>
                </div>
                Invoice Management
              </CardTitle>
              <CardDescription>
                Upload, process, and manage invoices with AI-powered data extraction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/invoices">
                <Button className="w-full" variant="outline">
                  Manage Invoices
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Welcome back, {user.email}!</CardTitle>
              <CardDescription>
                Choose an option above to get started, or explore our features:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <h3 className="font-semibold text-gray-900">Smart SQL</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Generate queries with natural language
                  </p>
                </div>
                <div className="text-center p-4">
                  <h3 className="font-semibold text-gray-900">File Processing</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Extract data from invoices automatically
                  </p>
                </div>
                <div className="text-center p-4">
                  <h3 className="font-semibold text-gray-900">Secure Storage</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Your data is encrypted and protected
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={() => {
                    // Handle sign out logic in AuthProvider
                    window.location.reload();
                  }}
                  className="text-gray-600"
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}