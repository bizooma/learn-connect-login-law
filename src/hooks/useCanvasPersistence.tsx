
import { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SavedCanvas {
  id: string;
  name: string;
  description?: string;
  nodes_data: Node[];
  edges_data: Edge[];
  created_at: string;
  updated_at: string;
}

export const useCanvasPersistence = () => {
  const [savedCanvases, setSavedCanvases] = useState<SavedCanvas[]>([]);
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);
  const [currentCanvasName, setCurrentCanvasName] = useState<string>('Untitled Canvas');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCanvases = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('flowchart_canvases')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Convert the data to match our SavedCanvas interface
      const transformedData: SavedCanvas[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        nodes_data: (item.nodes_data as unknown as Node[]) || [],
        edges_data: (item.edges_data as unknown as Edge[]) || [],
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setSavedCanvases(transformedData);
    } catch (error) {
      console.error('Error fetching canvases:', error);
      toast.error('Failed to load saved canvases');
    }
  }, []);

  const saveCanvas = useCallback(async (
    nodes: Node[], 
    edges: Edge[], 
    name: string, 
    description?: string
  ) => {
    setIsSaving(true);
    try {
      if (currentCanvasId) {
        // Update existing canvas
        const { error } = await supabase
          .from('flowchart_canvases')
          .update({
            name,
            description,
            nodes_data: nodes as unknown as any,
            edges_data: edges as unknown as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentCanvasId);

        if (error) throw error;
        toast.success('Canvas updated successfully');
      } else {
        // Create new canvas
        const { data, error } = await supabase
          .from('flowchart_canvases')
          .insert([{
            name,
            description,
            nodes_data: nodes as unknown as any,
            edges_data: edges as unknown as any,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }])
          .select()
          .single();

        if (error) throw error;
        setCurrentCanvasId(data.id);
        toast.success('Canvas saved successfully');
      }

      setCurrentCanvasName(name);
      await fetchCanvases();
    } catch (error) {
      console.error('Error saving canvas:', error);
      toast.error('Failed to save canvas');
    } finally {
      setIsSaving(false);
    }
  }, [currentCanvasId, fetchCanvases]);

  const loadCanvas = useCallback(async (canvasId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('flowchart_canvases')
        .select('*')
        .eq('id', canvasId)
        .single();

      if (error) throw error;

      setCurrentCanvasId(data.id);
      setCurrentCanvasName(data.name);
      return {
        nodes: (data.nodes_data as unknown as Node[]) || [],
        edges: (data.edges_data as unknown as Edge[]) || []
      };
    } catch (error) {
      console.error('Error loading canvas:', error);
      toast.error('Failed to load canvas');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewCanvas = useCallback(() => {
    setCurrentCanvasId(null);
    setCurrentCanvasName('Untitled Canvas');
    return {
      nodes: [],
      edges: []
    };
  }, []);

  const deleteCanvas = useCallback(async (canvasId: string) => {
    try {
      const { error } = await supabase
        .from('flowchart_canvases')
        .update({ is_active: false })
        .eq('id', canvasId);

      if (error) throw error;
      
      toast.success('Canvas deleted successfully');
      await fetchCanvases();
      
      if (currentCanvasId === canvasId) {
        createNewCanvas();
      }
    } catch (error) {
      console.error('Error deleting canvas:', error);
      toast.error('Failed to delete canvas');
    }
  }, [currentCanvasId, createNewCanvas, fetchCanvases]);

  const autoSave = useCallback(async (nodes: Node[], edges: Edge[]) => {
    if (currentCanvasId && nodes.length > 0) {
      try {
        await supabase
          .from('flowchart_canvases')
          .update({
            nodes_data: nodes as unknown as any,
            edges_data: edges as unknown as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentCanvasId);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [currentCanvasId]);

  return {
    savedCanvases,
    currentCanvasId,
    currentCanvasName,
    isSaving,
    isLoading,
    fetchCanvases,
    saveCanvas,
    loadCanvas,
    createNewCanvas,
    deleteCanvas,
    autoSave
  };
};
