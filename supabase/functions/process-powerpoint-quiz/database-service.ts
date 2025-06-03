
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { PowerPointImportRecord, ExtractedQuizData } from './types.ts';

export async function getImportRecord(supabaseClient: any, importId: string): Promise<PowerPointImportRecord> {
  const { data: importRecord, error: importError } = await supabaseClient
    .from('powerpoint_imports')
    .select('*')
    .eq('id', importId)
    .single();

  if (importError || !importRecord) {
    throw new Error('Import record not found');
  }

  return importRecord;
}

export async function updateImportStatus(supabaseClient: any, importId: string, status: string): Promise<void> {
  await supabaseClient
    .from('powerpoint_imports')
    .update({ status })
    .eq('id', importId);
}

export async function updateImportWithData(supabaseClient: any, importId: string, extractedData: ExtractedQuizData): Promise<void> {
  const { error: updateError } = await supabaseClient
    .from('powerpoint_imports')
    .update({
      status: 'completed',
      extracted_data: extractedData,
      updated_at: new Date().toISOString()
    })
    .eq('id', importId);

  if (updateError) {
    throw updateError;
  }
}

export async function updateImportWithError(supabaseClient: any, importId: string, errorMessage: string): Promise<void> {
  await supabaseClient
    .from('powerpoint_imports')
    .update({
      status: 'failed',
      error_message: errorMessage,
      updated_at: new Date().toISOString()
    })
    .eq('id', importId);
}

export async function downloadFile(supabaseClient: any, fileUrl: string): Promise<Blob> {
  const { data: fileData, error: downloadError } = await supabaseClient.storage
    .from('powerpoint-imports')
    .download(fileUrl);

  if (downloadError || !fileData) {
    throw new Error('Failed to download PowerPoint file');
  }

  return fileData;
}
