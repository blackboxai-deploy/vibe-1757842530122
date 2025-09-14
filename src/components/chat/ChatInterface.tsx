'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ChatMessage } from '@/lib/types';

export default function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [includeSql, setIncludeSql] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const renderSqlResults = (results: unknown) => {
    if (!results) return null;
    
    try {
      return (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <Label className="text-xs font-medium">Query Results:</Label>
          <pre className="mt-1 bg-gray-50 p-3 rounded text-sm overflow-x-auto max-h-40">
            {typeof results === 'string' ? results : JSON.stringify(results, null, 2)}
          </pre>
        </div>
      );
    } catch {
      return (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <Label className="text-xs font-medium">Query Results:</Label>
          <div className="mt-1 bg-gray-50 p-3 rounded text-sm">
            Results available but could not be displayed
          </div>
        </div>
      );
    }
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversation_id: conversationId,
          include_sql: includeSql,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.message,
          sql_query: data.data.sql_query,
          sql_results: data.data.sql_results,
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        if (!conversationId && data.data.conversation_id) {
          setConversationId(data.data.conversation_id);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
    toast.success('Chat cleared');
  };

  return (
    <CardContent className="flex flex-col h-[calc(100vh-280px)]">
      {/* Chat Controls */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="include-sql"
              checked={includeSql}
              onCheckedChange={setIncludeSql}
            />
            <Label htmlFor="include-sql">SQL Mode</Label>
          </div>
          <Badge variant={includeSql ? "default" : "secondary"}>
            {includeSql ? "SQL Enabled" : "Chat Only"}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearChat}
          disabled={messages.length === 0}
        >
          Clear Chat
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="max-w-md">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome to SQL Chat Assistant
              </h3>
              <p className="text-gray-600 mb-4">
                Ask me anything about SQL, databases, or data analysis. 
                {includeSql && " I can also generate SQL queries for you!"}
              </p>
              <div className="text-sm text-gray-500">
                <p>Try asking: &quot;How do I join two tables?&quot; or &quot;Show me all users from last month&quot;</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg px-4 py-3`}>
                  <div className="text-sm font-medium mb-1">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {message.sql_query && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <Label className="text-xs font-medium">Generated SQL:</Label>
                      <pre className="mt-1 bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                        {message.sql_query}
                      </pre>
                    </div>
                  )}
                  
                  {renderSqlResults(message.sql_results)}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-[80%]">
                  <div className="text-sm font-medium mb-1">Assistant</div>
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <Separator className="my-4" />

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={includeSql ? "Ask about SQL or request a query..." : "Type your message..."}
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          Send
        </Button>
      </form>
    </CardContent>
  );
}