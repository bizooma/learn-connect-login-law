
import React from 'react';
import { BookOpen, Package, FileText, Video, HelpCircle, Download, Link, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FlowchartItem } from './FlowchartContext';

interface SidebarItemProps {
  item: FlowchartItem;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'course': return <BookOpen className="h-4 w-4" />;
      case 'module': return <Package className="h-4 w-4" />;
      case 'lesson': return <FileText className="h-4 w-4" />;
      case 'unit': return <Video className="h-4 w-4" />;
      case 'quiz': return <HelpCircle className="h-4 w-4" />;
      case 'resource': return <Download className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getColorClass = () => {
    switch (item.type) {
      case 'course': return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'module': return 'text-purple-600 border-purple-200 bg-purple-50';
      case 'lesson': return 'text-green-600 border-green-200 bg-green-50';
      case 'unit': return 'text-orange-600 border-orange-200 bg-orange-50';
      case 'quiz': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'resource': return 'text-gray-600 border-gray-200 bg-gray-50';
      default: return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  const onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/json', JSON.stringify(item));
    event.dataTransfer.effectAllowed = item.isReusable ? 'copy' : 'move';
  };

  return (
    <Card 
      className={`cursor-grab active:cursor-grabbing border-l-4 ${getColorClass()} hover:shadow-md transition-shadow`}
      draggable
      onDragStart={onDragStart}
    >
      <CardContent className="p-3">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {item.title}
              </h4>
              {item.isReusable && (
                <Link className="h-3 w-3 text-blue-500" title="Reusable content" />
              )}
            </div>
            
            {item.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {item.description}
              </p>
            )}
            
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              {item.category && (
                <Badge variant="outline" className="h-4 text-xs">
                  {item.category}
                </Badge>
              )}
              
              {item.fileType && (
                <Badge variant="secondary" className="h-4 text-xs">
                  {item.fileType}
                </Badge>
              )}
              
              {item.passingScore && (
                <Badge variant="outline" className="h-4 text-xs">
                  Pass: {item.passingScore}%
                </Badge>
              )}
              
              {item.timeLimit && (
                <Badge variant="outline" className="h-4 text-xs">
                  {item.timeLimit}min
                </Badge>
              )}
              
              {item.usageCount && item.usageCount > 0 && (
                <Badge variant="default" className="h-4 text-xs bg-blue-100 text-blue-800">
                  <Users className="h-2 w-2 mr-1" />
                  Used {item.usageCount}x
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SidebarItem;
