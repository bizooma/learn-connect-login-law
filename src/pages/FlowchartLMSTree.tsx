
import React from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FlowchartSidebar from '@/components/flowchart-lms/FlowchartSidebar';
import FlowchartCanvas from '@/components/flowchart-lms/FlowchartCanvas';
import { FlowchartProvider } from '@/components/flowchart-lms/FlowchartContext';

const FlowchartLMSTree = () => {
  return (
    <FlowchartProvider>
      <div className="h-screen w-full flex bg-gray-50">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 shadow-lg">
          <FlowchartSidebar />
        </div>
        
        {/* Main Canvas */}
        <div className="flex-1">
          <FlowchartCanvas />
        </div>
      </div>
    </FlowchartProvider>
  );
};

export default FlowchartLMSTree;
