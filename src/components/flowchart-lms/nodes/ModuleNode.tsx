
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const ModuleNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <Card className={`min-w-48 border-l-4 border-l-purple-500 ${selected ? 'ring-2 ring-purple-300' : ''}`}>
      <CardHeader className="bg-purple-50 pb-2">
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-purple-600" />
          <div className="flex-1">
            <h4 className="font-medium text-purple-900">{data?.title as string}</h4>
            <Badge variant="outline" className="mt-1 text-xs">Module</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {data?.description && (
          <p className="text-xs text-gray-600">{data.description as string}</p>
        )}
      </CardContent>
      
      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
    </Card>
  );
};
