
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Download, FileText, File, Link, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const ResourceNode: React.FC<NodeProps> = ({ data, selected }) => {
  const getFileIcon = () => {
    switch (data?.fileType) {
      case 'PDF': return <FileText className="h-4 w-4 text-red-500" />;
      case 'DOCX': return <File className="h-4 w-4 text-blue-500" />;
      default: return <Download className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className={`min-w-40 border-l-4 border-l-gray-500 ${selected ? 'ring-2 ring-gray-300' : ''}`}>
      <CardHeader className="bg-gray-50 pb-2">
        <div className="flex items-center space-x-2">
          {getFileIcon()}
          <div className="flex-1">
            <div className="flex items-center space-x-1">
              <h6 className="font-medium text-gray-900 text-sm">{data?.title as string}</h6>
              {data?.isReusable && <Link className="h-3 w-3 text-blue-500" />}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">Resource</Badge>
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
        
        <div className="flex items-center space-x-2">
          {data?.category && (
            <Badge variant="secondary" className="text-xs">
              {data.category as string}
            </Badge>
          )}
          {data?.fileType && (
            <Badge variant="outline" className="text-xs">
              {data.fileType as string}
            </Badge>
          )}
        </div>
      </CardContent>
      
      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-500 border-2 border-white"
      />
    </Card>
  );
};
