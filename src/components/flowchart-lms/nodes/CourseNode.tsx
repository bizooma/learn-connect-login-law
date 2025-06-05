
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BookOpen, Users, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const CourseNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <Card className={`min-w-64 border-l-4 border-l-blue-500 ${selected ? 'ring-2 ring-blue-300' : ''}`}>
      <CardHeader className="bg-blue-50 pb-2">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">{data?.title as string}</h3>
            <Badge variant="outline" className="mt-1">Course</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-3">
        {data?.description && (
          <p className="text-sm text-gray-600 mb-3">{data.description as string}</p>
        )}
        
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>Students</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Duration</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3" />
            <span>Rating</span>
          </div>
        </div>
      </CardContent>
      
      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </Card>
  );
};
