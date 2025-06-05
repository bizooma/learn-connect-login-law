
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HelpCircle, Clock, Target, Link, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const QuizNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <Card className={`min-w-40 border-l-4 border-l-yellow-500 ${selected ? 'ring-2 ring-yellow-300' : ''}`}>
      <CardHeader className="bg-yellow-50 pb-2">
        <div className="flex items-center space-x-2">
          <HelpCircle className="h-4 w-4 text-yellow-600" />
          <div className="flex-1">
            <div className="flex items-center space-x-1">
              <h6 className="font-medium text-yellow-900 text-sm">{data?.title as string}</h6>
              {data?.isReusable && <Link className="h-3 w-3 text-blue-500" />}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">Quiz</Badge>
              {data?.usageCount && (data.usageCount as number) > 0 && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  <Users className="h-2 w-2 mr-1" />
                  {data.usageCount as number}x
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {data?.description && (
          <p className="text-xs text-gray-600 mb-2">{data.description as string}</p>
        )}
        
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          {data?.passingScore && (
            <div className="flex items-center space-x-1">
              <Target className="h-3 w-3" />
              <span>{data.passingScore as number}%</span>
            </div>
          )}
          {data?.timeLimit && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{data.timeLimit as number}m</span>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
      />
    </Card>
  );
};
