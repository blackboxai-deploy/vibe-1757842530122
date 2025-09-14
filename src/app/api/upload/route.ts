import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { extractInvoiceData } from '@/lib/openai';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type and size
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only PDF, PNG, and JPEG files are allowed.' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Get user from auth header
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

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${user.id}/${timestamp}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const originalBuffer = new Uint8Array(bytes);
    let processedBuffer: Buffer | Uint8Array = originalBuffer;

    // Optimize images with Sharp (only for images)
    if (file.type.startsWith('image/')) {
      try {
        processedBuffer = await sharp(originalBuffer)
          .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
      } catch (sharpError) {
        console.warn('Sharp processing failed, using original file:', sharpError);
        processedBuffer = originalBuffer;
      }
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filename, processedBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(filename);

    // Extract text for AI processing
    let extractedText = '';
    if (file.type === 'application/pdf') {
      // In production, you would use a PDF text extraction library like pdf-parse
      extractedText = 'PDF text extraction would happen here';
    } else {
      // For images, you could use OCR like Tesseract.js
      extractedText = 'OCR text extraction would happen here';
    }

    // Extract invoice data using OpenAI
    let extractedData = {};
    try {
      extractedData = await extractInvoiceData(extractedText);
    } catch (aiError) {
      console.warn('AI extraction failed:', aiError);
      // Continue without extracted data
    }

    // Save invoice metadata to database
    const { data: invoice, error: dbError } = await supabase
      .from('invoices')
      .insert([{
        user_id: user.id,
        filename: filename,
        original_filename: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        extracted_data: extractedData,
      }])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      
      // Clean up uploaded file
      await supabase.storage
        .from('invoices')
        .remove([filename]);

      return NextResponse.json(
        { success: false, error: 'Failed to save invoice data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        public_url: urlData.publicUrl,
      },
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle file size limits
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds