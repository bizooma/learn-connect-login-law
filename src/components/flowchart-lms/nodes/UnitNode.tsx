
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Video, Link, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const UnitNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <Card className={`min-w-40 border-l-4 border-l-orange-500 ${selected ? 'ring-2 ring-orange-300' : ''}`}>
      <CardHeader className="bg-orange-50 pb-2">
        <div className="flex items-center space-x-2">
          <Video className="h-4 w-4 text-orange-600" />
          <div className="flex-1">
            <div className="flex items-center space-x-1">
              <h6 className="font-medium text-orange-900 text-sm">{data?.title as string}</h6>
              {data?.isReusable && <Link className="h-3 w-3 text-blue-500" />}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">Unit</Badge>
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
          <p className="text-xs text-gray-600">{data.description as string}</p>
        )}
      </CardContent>
      
      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />
    </Card>
  );
};
