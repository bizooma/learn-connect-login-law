
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, X } from "lucide-react";
import { useState } from "react";

const MarkdownHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <HelpCircle className="h-4 w-4" />
        Formatting Help
      </Button>
    );
  }

  return (
    <Card className="mt-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Markdown Formatting Guide</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium mb-1">Headers:</p>
            <p className="text-muted-foreground"># Large Header</p>
            <p className="text-muted-foreground">## Medium Header</p>
            <p className="text-muted-foreground">### Small Header</p>
          </div>
          <div>
            <p className="font-medium mb-1">Text Formatting:</p>
            <p className="text-muted-foreground">**Bold Text**</p>
            <p className="text-muted-foreground">*Italic Text*</p>
            <p className="text-muted-foreground">`Code Text`</p>
          </div>
          <div>
            <p className="font-medium mb-1">Lists:</p>
            <p className="text-muted-foreground">- Bullet point</p>
            <p className="text-muted-foreground">1. Numbered list</p>
          </div>
          <div>
            <p className="font-medium mb-1">Links & More:</p>
            <p className="text-muted-foreground">[Link Text](URL)</p>
            <p className="text-muted-foreground">{">"} Quote block</p>
            <p className="text-muted-foreground">--- (line break)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarkdownHelp;
