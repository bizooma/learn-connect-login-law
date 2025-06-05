
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const LessonNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <Card className={`min-w-44 border-l-4 border-l-green-500 ${selected ? 'ring-2 ring-green-300' : ''}`}>
      <CardHeader className="bg-green-50 pb-2">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-green-600" />
          <div className="flex-1">
            <h5 className="font-medium text-green-900 text-sm">{data?.title as string}</h5>
            <Badge variant="outline" className="mt-1 text-xs">Lesson</Badge>
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
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </Card>
  );
};
