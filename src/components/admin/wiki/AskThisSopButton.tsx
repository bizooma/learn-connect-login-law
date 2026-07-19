import { useState } from "react";
import { Sparkles } from "lucide-react";
import AskThisSopPanel from "./AskThisSopPanel";

interface AskThisSopButtonProps {
  articleId: string;
  articleTitle?: string;
  variant?: "floating" | "inline";
}

const AskThisSopButton = ({ articleId, articleTitle, variant = "floating" }: AskThisSopButtonProps) => {
  const [open, setOpen] = useState(false);

  if (variant === "inline") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-black hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#FFDA00" }}
        >
          <Sparkles className="h-4 w-4" /> Ask this SOP
        </button>
        <AskThisSopPanel open={open} onOpenChange={setOpen} articleId={articleId} articleTitle={articleTitle} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask this SOP"
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-black shadow-lg hover:shadow-xl hover:opacity-95 transition-all"
        style={{ backgroundColor: "#FFDA00" }}
      >
        <Sparkles className="h-5 w-5" /> Ask this SOP
      </button>
      <AskThisSopPanel open={open} onOpenChange={setOpen} articleId={articleId} articleTitle={articleTitle} />
    </>
  );
};

export default AskThisSopButton;
