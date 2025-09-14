import OpenAI from 'openai';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Chat completion with SQL generation capabilities
export async function generateChatResponse(
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  includeSql: boolean = false
) {
  try {
    const systemPrompt = includeSql
      ? `You are a helpful AI assistant that specializes in SQL and data analysis. 
         When users ask questions that could be answered with SQL queries, provide both:
         1. A conversational response
         2. A SQL query that could help answer their question
         
         Format SQL queries in code blocks with the language specified as 'sql'.
         Only suggest SQL queries when they would be relevant and helpful.
         Be careful to write safe, read-only queries when possible.`
      : `You are a helpful AI assistant. Provide clear, concise, and helpful responses to user questions.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory,
      { role: 'user' as const, content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: false,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    
    // Extract SQL query if present
    let sqlQuery = null;
    const sqlMatch = response.match(/```sql\n([\s\S]*?)\n```/);
    if (sqlMatch && sqlMatch[1]) {
      sqlQuery = sqlMatch[1].trim();
    }

    return {
      response,
      sqlQuery,
      usage: completion.usage,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate response from OpenAI');
  }
}

// Generate streaming response for real-time chat
export async function generateStreamingResponse(
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  includeSql: boolean = false
) {
  try {
    const systemPrompt = includeSql
      ? `You are a helpful AI assistant that specializes in SQL and data analysis. 
         When users ask questions that could be answered with SQL queries, provide both:
         1. A conversational response
         2. A SQL query that could help answer their question
         
         Format SQL queries in code blocks with the language specified as 'sql'.
         Only suggest SQL queries when they would be relevant and helpful.
         Be careful to write safe, read-only queries when possible.`
      : `You are a helpful AI assistant. Provide clear, concise, and helpful responses to user questions.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory,
      { role: 'user' as const, content: message },
    ];

    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    });

    return stream;
  } catch (error) {
    console.error('OpenAI streaming error:', error);
    throw new Error('Failed to generate streaming response from OpenAI');
  }
}

// Extract invoice data using OpenAI
export async function extractInvoiceData(invoiceText: string) {
  try {
    const systemPrompt = `You are an AI assistant specialized in extracting structured data from invoice text.
    Extract the following information from the invoice text and return it as a JSON object:
    - amount (number): Total invoice amount
    - date (string): Invoice date in YYYY-MM-DD format
    - vendor (string): Company/vendor name
    - invoice_number (string): Invoice number or ID
    - description (string): Brief description of services/products
    - tax_amount (number): Tax amount if present
    - currency (string): Currency code (USD, EUR, etc.)
    
    If any field is not found, set it to null.
    Return only valid JSON, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Extract data from this invoice text:\n\n${invoiceText}` },
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const response = completion.choices[0]?.message?.content || '{}';
    
    try {
      return JSON.parse(response);
    } catch {
      console.error('Failed to parse JSON response:', response);
      return {};
    }
  } catch (error) {
    console.error('OpenAI invoice extraction error:', error);
    return {};
  }
}