
import { supabase } from "@/integrations/supabase/client";
import { UnitData } from "../types";

export interface UnitUpdateResult {
  success: boolean;
  unitId?: string;
  errors: string[];
  warnings: string[];
}

export const updateUnitsEnhanced = async (
  sectionId: string,
  units: UnitData[]
): Promise<UnitUpdateResult[]> => {
  console.log('🔧 Starting enhanced unit updates for section:', sectionId);
  
  const results: UnitUpdateResult[] = [];
  
  // Process units in transaction-safe batches
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const result: UnitUpdateResult = {
      success: false,
      errors: [],
      warnings: []
    };
    
    try {
      console.log(`📝 Processing unit ${i + 1}/${units.length}: "${unit.title}"`);
      
      // Handle video file upload if present
      let videoUrl = unit.video_url;
      if (unit.video_file) {
        try {
          const { uploadVideoFile } = await import("../fileUploadUtils");
          videoUrl = await uploadVideoFile(unit.video_file);
          console.log('📹 Video uploaded successfully:', videoUrl);
        } catch (error) {
          result.warnings.push(`Video upload failed: ${error.message}`);
          console.warn('Video upload failed:', error);
        }
      }
      
      // Handle multiple files upload
      let filesData = unit.files;
      if (unit.file_uploads && unit.file_uploads.length > 0) {
        try {
          const { createMultipleFileUpload } = await import("./fileUploadService");
          filesData = await createMultipleFileUpload(unit.file_uploads, 'unit', i);
          console.log('📎 Multiple files uploaded successfully');
        } catch (error) {
          result.warnings.push(`File uploads failed: ${error.message}`);
          console.warn('File uploads failed:', error);
        }
      }
      
      // Use the safe upsert function to handle conflicts
      const { data: unitId, error } = await supabase.rpc('safe_unit_upsert', {
        p_unit_id: unit.id || null,
        p_section_id: sectionId,
        p_title: unit.title,
        p_description: unit.description || '',
        p_content: unit.content || '',
        p_video_url: videoUrl || '',
        p_duration_minutes: unit.duration_minutes || 0,
        p_sort_order: i,
        p_file_url: unit.file_url || null,
        p_file_name: unit.file_name || null,
        p_file_size: unit.file_size || null,
        p_files: filesData || null
      });
      
      if (error) {
        console.error('❌ Unit upsert failed:', error);
        result.errors.push(`Unit update failed: ${error.message}`);
      } else {
        console.log('✅ Unit updated successfully:', unitId);
        result.success = true;
        result.unitId = unitId;
      }
      
    } catch (error) {
      console.error('❌ Unexpected error during unit update:', error);
      result.errors.push(`Unexpected error: ${error.message}`);
    }
    
    results.push(result);
  }
  
  console.log('🏁 Enhanced unit updates completed');
  return results;
};

export const cleanupOrphanedUnits = async (sectionId: string, keepUnitIds: string[]) => {
  console.log('🧹 Cleaning up orphaned units for section:', sectionId);
  
  try {
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('section_id', sectionId)
      .not('id', 'in', `(${keepUnitIds.map(id => `'${id}'`).join(',')})`);
    
    if (error) {
      console.error('❌ Failed to cleanup orphaned units:', error);
      throw error;
    }
    
    console.log('✅ Orphaned units cleaned up successfully');
  } catch (error) {
    console.error('❌ Error during orphaned units cleanup:', error);
    throw error;
  }
};
