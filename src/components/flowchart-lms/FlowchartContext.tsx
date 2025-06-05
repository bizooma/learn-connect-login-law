import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  NodeChange,
  EdgeChange
} from '@xyflow/react';
import { supabase } from '@/integrations/supabase/client';
import { useCanvasPersistence } from '@/hooks/useCanvasPersistence';

export interface FlowchartItem {
  id: string;
  title: string;
  type: 'course' | 'module' | 'lesson' | 'unit' | 'quiz' | 'resource';
  description?: string;
  category?: string;
  fileType?: string;
  passingScore?: number;
  timeLimit?: number;
  usageCount?: number;
  isReusable?: boolean;
  instructor?: string;
  level?: string;
  duration?: string;
}

interface FlowchartContextType {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  sidebarItems: FlowchartItem[];
  addNodeToCanvas: (item: FlowchartItem, position: { x: number; y: number }) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  loading: boolean;
  refetchData: () => void;
  loadCanvas: (nodes: Node[], edges: Edge[]) => void;
  canvasPersistence: ReturnType<typeof useCanvasPersistence>;
}

const FlowchartContext = createContext<FlowchartContextType | undefined>(undefined);

export const useFlowchart = () => {
  const context = useContext(FlowchartContext);
  if (!context) {
    throw new Error('useFlowchart must be used within a FlowchartProvider');
  }
  return context;
};

export const FlowchartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sidebarItems, setSidebarItems] = useState<FlowchartItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const canvasPersistence = useCanvasPersistence();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNodeToCanvas = useCallback((item: FlowchartItem, position: { x: number; y: number }) => {
    const newNode: Node = {
      id: `canvas-${item.id}-${Date.now()}`,
      type: item.type,
      position,
      data: { 
        ...item,
        originalId: item.id 
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const loadCanvas = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      canvasPersistence.autoSave(nodes, edges);
    }, 30000); // Auto-save every 30 seconds

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [nodes, edges, canvasPersistence]);

  // Fetch real data from Supabase
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch courses (excluding temp ones)
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_draft', false)
        .neq('title', '__TEMP_ORPHANED_CONTENT__')
        .order('created_at', { ascending: false });

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        return;
      }

      // Fetch modules with their course info (excluding temp ones)
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select(`
          *,
          courses!inner(title, category)
        `)
        .eq('is_draft', false)
        .neq('title', '__TEMP_ORPHANED_MODULE__')
        .order('created_at', { ascending: false });

      if (modulesError) {
        console.error('Error fetching modules:', modulesError);
      }

      // Fetch lessons with their course and module info (excluding temp ones)
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          *,
          courses!inner(title, category),
          modules!inner(title)
        `)
        .eq('is_draft', false)
        .neq('title', '__TEMP_ORPHANED_LESSON__')
        .order('created_at', { ascending: false });

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
      }

      // Fetch units with their lesson info (excluding temp ones)
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select(`
          *,
          lessons!inner(title, course_id, courses!inner(title))
        `)
        .eq('is_draft', false)
        .order('created_at', { ascending: false });

      if (unitsError) {
        console.error('Error fetching units:', unitsError);
      }

      // Fetch quizzes with their unit info
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select(`
          *,
          units!inner(title, section_id, lessons!inner(title, course_id, courses!inner(title)))
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (quizzesError) {
        console.error('Error fetching quizzes:', quizzesError);
      }

      // Transform data into FlowchartItem format
      const items: FlowchartItem[] = [];

      // Add courses
      if (courses) {
        courses.forEach(course => {
          items.push({
            id: course.id,
            title: course.title,
            type: 'course',
            description: course.description || undefined,
            category: course.category,
            instructor: course.instructor,
            level: course.level,
            duration: course.duration
          });
        });
      }

      // Add modules (those not already represented in course structure)
      if (modules) {
        modules.forEach(module => {
          items.push({
            id: module.id,
            title: module.title,
            type: 'module',
            description: module.description || undefined,
            category: module.courses?.category,
            isReusable: true
          });
        });
      }

      // Add lessons (those not already represented in module structure)
      if (lessons) {
        lessons.forEach(lesson => {
          items.push({
            id: lesson.id,
            title: lesson.title,
            type: 'lesson',
            description: lesson.description || undefined,
            category: lesson.courses?.category,
            isReusable: true
          });
        });
      }

      // Add units as reusable content
      if (units) {
        units.forEach(unit => {
          items.push({
            id: unit.id,
            title: unit.title,
            type: 'unit',
            description: unit.description || undefined,
            isReusable: true,
            usageCount: 1 // Could be calculated from actual usage
          });
        });
      }

      // Add quizzes as reusable content
      if (quizzes) {
        quizzes.forEach(quiz => {
          items.push({
            id: quiz.id,
            title: quiz.title,
            type: 'quiz',
            description: quiz.description || undefined,
            passingScore: quiz.passing_score,
            timeLimit: quiz.time_limit_minutes,
            isReusable: true,
            usageCount: 1 // Could be calculated from actual usage
          });
        });
      }

      // Add some mock resources for now (you can extend this later)
      const mockResources: FlowchartItem[] = [
        { id: 'resource-1', title: 'Contract Template', type: 'resource', category: 'Forms', fileType: 'DOCX', description: 'Standard contract template', isReusable: true, usageCount: 8 },
        { id: 'resource-2', title: 'Legal Research Guide', type: 'resource', category: 'Guides', fileType: 'PDF', description: 'Comprehensive research guide', isReusable: true, usageCount: 12 },
        { id: 'resource-3', title: 'Ethics Handbook', type: 'resource', category: 'Legal', fileType: 'PDF', description: 'Professional ethics handbook', isReusable: true, usageCount: 7 },
        { id: 'resource-4', title: 'Client Intake Form', type: 'resource', category: 'Forms', fileType: 'PDF', description: 'Standard intake form', isReusable: true, usageCount: 15 },
      ];

      items.push(...mockResources);

      setSidebarItems(items);
    } catch (error) {
      console.error('Error fetching flowchart data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSidebarItems = sidebarItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           item.type === selectedCategory ||
                           item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <FlowchartContext.Provider
      value={{
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        sidebarItems: filteredSidebarItems,
        addNodeToCanvas,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        loading,
        refetchData: fetchData,
        loadCanvas,
        canvasPersistence,
      }}
    >
      {children}
    </FlowchartContext.Provider>
  );
};
