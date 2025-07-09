
import React from 'react';
import '@xyflow/react/dist/style.css';
import { LazyFlowchartSidebar, LazyFlowchartCanvas } from '@/components/lazy/LazyFlowchartComponents';
import { FlowchartProvider } from '@/components/flowchart-lms/FlowchartContext';

const FlowchartLMSTree = () => {
  return (
    <FlowchartProvider>
      <div className="h-screen w-full flex bg-gray-50">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 shadow-lg">
          <LazyFlowchartSidebar />
        </div>
        
        {/* Main Canvas */}
        <div className="flex-1">
          <LazyFlowchartCanvas />
        </div>
      </div>
    </FlowchartProvider>
  );
};

export default FlowchartLMSTree;
