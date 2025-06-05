
import React, { createContext, useContext, useState, useCallback } from 'react';
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
}

const FlowchartContext = createContext<FlowchartContextType | undefined>(undefined);

export const useFlowchart = () => {
  const context = useContext(FlowchartContext);
  if (!context) {
    throw new Error('useFlowchart must be used within a FlowchartProvider');
  }
  return context;
};

// Mock data for demonstration
const mockSidebarItems: FlowchartItem[] = [
  // Courses
  { id: 'course-1', title: 'Business Law Fundamentals', type: 'course', description: 'Introduction to business law' },
  { id: 'course-2', title: 'Contract Negotiations', type: 'course', description: 'Advanced contract strategies' },
  
  // Modules
  { id: 'module-1', title: 'Legal Ethics', type: 'module', description: 'Professional responsibility' },
  { id: 'module-2', title: 'Corporate Structures', type: 'module', description: 'Business entity types' },
  
  // Lessons
  { id: 'lesson-1', title: 'Introduction to Contracts', type: 'lesson', description: 'Contract basics' },
  { id: 'lesson-2', title: 'Liability Issues', type: 'lesson', description: 'Understanding liability' },
  { id: 'lesson-3', title: 'Intellectual Property', type: 'lesson', description: 'IP fundamentals' },
  
  // Units (reusable)
  { id: 'unit-1', title: 'Case Study: Smith v. Jones', type: 'unit', description: 'Contract dispute analysis', isReusable: true, usageCount: 3 },
  { id: 'unit-2', title: 'Legal Research Methods', type: 'unit', description: 'Research techniques', isReusable: true, usageCount: 5 },
  { id: 'unit-3', title: 'Client Interview Techniques', type: 'unit', description: 'Best practices', isReusable: true, usageCount: 2 },
  
  // Quizzes (reusable)
  { id: 'quiz-1', title: 'Contract Law Quiz', type: 'quiz', description: 'Test your knowledge', passingScore: 80, timeLimit: 30, isReusable: true, usageCount: 4 },
  { id: 'quiz-2', title: 'Ethics Assessment', type: 'quiz', description: 'Professional ethics', passingScore: 90, timeLimit: 45, isReusable: true, usageCount: 6 },
  { id: 'quiz-3', title: 'Liability Quiz', type: 'quiz', description: 'Understanding liability', passingScore: 75, timeLimit: 20, isReusable: true, usageCount: 2 },
  
  // Resources (reusable)
  { id: 'resource-1', title: 'Contract Template', type: 'resource', category: 'Forms', fileType: 'DOCX', description: 'Standard contract template', isReusable: true, usageCount: 8 },
  { id: 'resource-2', title: 'Legal Research Guide', type: 'resource', category: 'Guides', fileType: 'PDF', description: 'Comprehensive research guide', isReusable: true, usageCount: 12 },
  { id: 'resource-3', title: 'Ethics Handbook', type: 'resource', category: 'Legal', fileType: 'PDF', description: 'Professional ethics handbook', isReusable: true, usageCount: 7 },
  { id: 'resource-4', title: 'Client Intake Form', type: 'resource', category: 'Forms', fileType: 'PDF', description: 'Standard intake form', isReusable: true, usageCount: 15 },
];

export const FlowchartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const filteredSidebarItems = mockSidebarItems.filter(item => {
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
      }}
    >
      {children}
    </FlowchartContext.Provider>
  );
};
