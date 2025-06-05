
import React, { useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Panel } from '@xyflow/react';
import { Package } from 'lucide-react';
import { useFlowchart } from './FlowchartContext';
import { CourseNode } from './nodes/CourseNode';
import { ModuleNode } from './nodes/ModuleNode';
import { LessonNode } from './nodes/LessonNode';
import { UnitNode } from './nodes/UnitNode';
import { QuizNode } from './nodes/QuizNode';
import { ResourceNode } from './nodes/ResourceNode';

const nodeTypes = {
  course: CourseNode,
  module: ModuleNode,
  lesson: LessonNode,
  unit: UnitNode,
  quiz: QuizNode,
  resource: ResourceNode,
};

const FlowchartCanvas: React.FC = () => {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addNodeToCanvas,
    sidebarItems,
    loading
  } = useFlowchart();

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      const reactFlowBounds = (event.target as Element).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      
      try {
        const item = JSON.parse(event.dataTransfer.getData('application/json'));
        addNodeToCanvas(item, position);
      } catch (error) {
        console.error('Error parsing dropped item:', error);
      }
    },
    [addNodeToCanvas]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap 
          nodeStrokeColor={(n) => {
            switch (n.type) {
              case 'course': return '#2563eb';
              case 'module': return '#7c3aed';
              case 'lesson': return '#059669';
              case 'unit': return '#ea580c';
              case 'quiz': return '#ca8a04';
              case 'resource': return '#374151';
              default: return '#6b7280';
            }
          }}
          nodeColor={(n) => {
            switch (n.type) {
              case 'course': return '#dbeafe';
              case 'module': return '#e9d5ff';
              case 'lesson': return '#d1fae5';
              case 'unit': return '#fed7aa';
              case 'quiz': return '#fef3c7';
              case 'resource': return '#f3f4f6';
              default: return '#f9fafb';
            }
          }}
          maskColor="rgb(240, 242, 246, 0.7)"
        />
        
        <Panel position="top-left" className="m-4">
          <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">LMS Course Structure Builder</h3>
            <p className="text-xs text-gray-600">
              Drag your courses and content from the sidebar to visualize and plan your course structure. 
              Connect elements by dragging between connection points.
            </p>
          </div>
        </Panel>

        {nodes.length === 0 && sidebarItems.length > 0 && !loading && (
          <Panel position="top-center" className="pointer-events-none">
            <div className="bg-white/90 rounded-lg p-8 text-center shadow-lg border border-gray-200">
              <div className="text-gray-400 mb-4">
                <Package className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start Building Your Course Structure
              </h3>
              <p className="text-gray-600 max-w-md">
                Drag your courses from the sidebar to visualize how modules, lessons, units, and quizzes connect together.
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default FlowchartCanvas;
