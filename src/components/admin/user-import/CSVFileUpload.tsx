
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

interface CSVFileUploadProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const CSVFileUpload = ({ onFileSelect }: CSVFileUploadProps) => {
  return (
    <div>
      <Input
        type="file"
        accept=".csv"
        onChange={onFileSelect}
        className="cursor-pointer"
      />
      <div className="text-sm text-gray-500 mt-2 space-y-1">
        <p>CSV should have 4 columns: role, First Name, Last Name, email address</p>
        <p className="text-blue-600">• Email address is required</p>
        <p className="text-blue-600">• Empty role defaults to 'student'</p>
        <p className="text-blue-600">• First Name and Last Name can be empty</p>
      </div>
    </div>
  );
};

export default CSVFileUpload;
