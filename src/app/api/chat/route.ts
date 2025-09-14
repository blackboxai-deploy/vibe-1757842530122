import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateChatResponse } from '@/lib/openai';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversation_id, include_sql = false } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get user from auth header or session
    const authHeader = request.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    );

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let currentConversationId = conversation_id;

    // Create new conversation if none exists
    if (!currentConversationId) {
      const conversationTitle = message.slice(0, 50) + (message.length > 50 ? '...' : '');
      
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert([{
          user_id: user.id,
          title: conversationTitle,
        }])
        .select()
        .single();

      if (conversationError) {
        console.error('Error creating conversation:', conversationError);
        return NextResponse.json(
          { success: false, error: 'Failed to create conversation' },
          { status: 500 }
        );
      }

      currentConversationId = conversation.id;
    }

    // Get conversation history for context
    const { data: historyMessages, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true })
      .limit(10); // Last 10 messages for context

    if (historyError) {
      console.error('Error fetching conversation history:', historyError);
    }

    const conversationHistory = historyMessages?.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })) || [];

    // Save user message
    const { error: userMessageError } = await supabase
      .from('messages')
      .insert([{
        conversation_id: currentConversationId,
        role: 'user',
        content: message,
      }]);

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
    }

    // Generate AI response
    const aiResponse = await generateChatResponse(
      message,
      conversationHistory,
      include_sql
    );

    let sqlResults = null;
    let sqlError = null;

    // Execute SQL if provided and safe
    if (aiResponse.sqlQuery && include_sql) {
      try {
        // For demo purposes, we'll just simulate SQL execution
        // In a real app, you'd want to connect to your actual database
        // and implement proper SQL validation and sandboxing
        
        // This is a placeholder - replace with actual database execution
        sqlResults = {
          message: "SQL execution is not implemented in this demo",
          query: aiResponse.sqlQuery,
          note: "This would execute against your actual database in production"
        };
        
        // Save SQL query to history
        await supabase
          .from('sql_queries')
          .insert([{
            user_id: user.id,
            query: aiResponse.sqlQuery,
            results: sqlResults,
            execution_time: 0,
          }]);

      } catch (sqlErr) {
        sqlError = sqlErr instanceof Error ? sqlErr.message : 'SQL execution error';
        console.error('SQL execution error:', sqlErr);
      }
    }

    // Save assistant message
    const { error: assistantMessageError } = await supabase
      .from('messages')
      .insert([{
        conversation_id: currentConversationId,
        role: 'assistant',
        content: aiResponse.response,
        sql_query: aiResponse.sqlQuery,
        sql_results: sqlResults,
      }]);

    if (assistantMessageError) {
      console.error('Error saving assistant message:', assistantMessageError);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: aiResponse.response,
        conversation_id: currentConversationId,
        sql_query: aiResponse.sqlQuery,
        sql_results: sqlResults,
        sql_error: sqlError,
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}