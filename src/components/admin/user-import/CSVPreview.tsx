
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface CSVPreviewProps {
  csvPreview: string[][];
}

const CSVPreview = ({ csvPreview }: CSVPreviewProps) => {
  if (csvPreview.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          CSV Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <tbody>
              {csvPreview.map((row, index) => (
                <tr key={index} className={index === 0 ? "bg-gray-50 font-medium" : ""}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-300 px-3 py-2 text-sm">
                      {cell || (index > 0 ? <span className="text-gray-400 italic">empty</span> : cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {csvPreview.length >= 6 && (
          <p className="text-sm text-gray-500 mt-2">
            Showing first 5 rows + header. Total rows will be processed on import.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CSVPreview;
