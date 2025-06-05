
import { useState } from "react";
import { ChevronDown, ChevronRight, LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface KnowledgeBaseItem {
  title: string;
  content: string;
}

interface KnowledgeBaseSectionProps {
  title: string;
  icon: LucideIcon;
  color: string;
  items: KnowledgeBaseItem[];
  searchTerm: string;
}

const KnowledgeBaseSection = ({ 
  title, 
  icon: Icon, 
  color, 
  items, 
  searchTerm 
}: KnowledgeBaseSectionProps) => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Filter items based on search term
  const filteredItems = searchTerm
    ? items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : items;

  if (filteredItems.length === 0 && searchTerm) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50">
        <CardTitle className={`flex items-center text-xl ${color}`}>
          <Icon className="h-6 w-6 mr-3" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {filteredItems.map((item, index) => (
            <Collapsible 
              key={index}
              open={openItems.has(index)}
              onOpenChange={() => toggleItem(index)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto text-left hover:bg-gray-50 rounded-none border-b border-gray-100 last:border-b-0"
                >
                  <span className="font-medium text-gray-900">
                    {highlightText(item.title, searchTerm)}
                  </span>
                  {openItems.has(index) ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <div className="text-gray-600 leading-relaxed">
                  {highlightText(item.content, searchTerm)}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default KnowledgeBaseSection;
