
import React, { useState } from 'react';
import { Save, FolderOpen, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCanvasPersistence, SavedCanvas } from '@/hooks/useCanvasPersistence';
import { Node, Edge } from '@xyflow/react';

interface CanvasManagerProps {
  nodes: Node[];
  edges: Edge[];
  onLoadCanvas: (nodes: Node[], edges: Edge[]) => void;
}

const CanvasManager: React.FC<CanvasManagerProps> = ({ nodes, edges, onLoadCanvas }) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [selectedCanvasId, setSelectedCanvasId] = useState<string>('');

  const {
    savedCanvases,
    currentCanvasName,
    isSaving,
    isLoading,
    fetchCanvases,
    saveCanvas,
    loadCanvas,
    createNewCanvas,
    deleteCanvas
  } = useCanvasPersistence();

  React.useEffect(() => {
    fetchCanvases();
  }, [fetchCanvases]);

  const handleSave = async () => {
    if (!saveName.trim()) return;
    
    await saveCanvas(nodes, edges, saveName, saveDescription);
    setSaveDialogOpen(false);
    setSaveName('');
    setSaveDescription('');
  };

  const handleLoad = async () => {
    if (!selectedCanvasId) return;
    
    const result = await loadCanvas(selectedCanvasId);
    if (result) {
      onLoadCanvas(result.nodes, result.edges);
      setLoadDialogOpen(false);
      setSelectedCanvasId('');
    }
  };

  const handleNewCanvas = () => {
    const result = createNewCanvas();
    onLoadCanvas(result.nodes, result.edges);
  };

  const handleDelete = async (canvasId: string) => {
    await deleteCanvas(canvasId);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">{currentCanvasName}</span>
      
      {/* Save Canvas */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            size="sm" 
            variant="outline" 
            disabled={isSaving || nodes.length === 0}
            onClick={() => setSaveName(currentCanvasName)}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Canvas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="canvas-name">Canvas Name</Label>
              <Input
                id="canvas-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter canvas name"
              />
            </div>
            <div>
              <Label htmlFor="canvas-description">Description (optional)</Label>
              <Textarea
                id="canvas-description"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Describe this canvas design"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!saveName.trim() || isSaving}>
                Save Canvas
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Canvas */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
            Load
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Saved Canvas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Canvas</Label>
              <Select value={selectedCanvasId} onValueChange={setSelectedCanvasId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a saved canvas" />
                </SelectTrigger>
                <SelectContent>
                  {savedCanvases.map((canvas) => (
                    <SelectItem key={canvas.id} value={canvas.id}>
                      <div className="flex justify-between items-center w-full">
                        <div>
                          <div className="font-medium">{canvas.name}</div>
                          {canvas.description && (
                            <div className="text-sm text-gray-500">{canvas.description}</div>
                          )}
                          <div className="text-xs text-gray-400">
                            Updated: {new Date(canvas.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 ml-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Canvas</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{canvas.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(canvas.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {savedCanvases.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No saved canvases found. Create your first design and save it!
              </p>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleLoad} disabled={!selectedCanvasId || isLoading}>
                Load Canvas
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Canvas */}
      <Button size="sm" variant="outline" onClick={handleNewCanvas}>
        <Plus className="h-4 w-4" />
        New
      </Button>
    </div>
  );
};

export default CanvasManager;
