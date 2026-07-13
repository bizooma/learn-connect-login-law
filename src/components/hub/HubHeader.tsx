import { LayoutGrid } from "lucide-react";

interface HubHeaderProps {
  subtitle?: string;
}

const HubHeader = ({ subtitle }: HubHeaderProps) => (
  <header style={{ background: "#213C82" }} className="shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
      <img
        src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png"
        alt="New Frontier University"
        className="h-12 w-auto"
      />
      <div className="flex items-center gap-3">
        <LayoutGrid className="h-8 w-8 text-white" />
        <div>
          <h1 className="text-2xl font-bold text-white">Departments</h1>
          <p className="text-white/80 text-sm">
            {subtitle ?? "Choose a department to get started"}
          </p>
        </div>
      </div>
    </div>
  </header>
);

export default HubHeader;
