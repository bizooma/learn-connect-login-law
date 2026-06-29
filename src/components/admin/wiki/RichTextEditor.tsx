import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { Extension } from "@tiptap/core";

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize?.replace(/['"]/g, "") || null,
            renderHTML: (attributes: any) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }: any) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    } as any;
  },
});

const FONT_SIZES = ["10", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "60", "72"];
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Youtube from "@tiptap/extension-youtube";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Code,
  Quote,
  Subscript as SubIcon,
  Superscript as SupIcon,
  Highlighter,
  RemoveFormatting,
  Indent,
  Outdent,
  Video,
  Smile,
  Table as TableIcon,
  CodeXml,
  Paperclip,
  Sparkles,
  Type,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

const ICON_SET = [
  "✅","❌","⭐","🔥","💡","📌","📝","📎","📁","📂","📅","📊","📈","📉","🎯","🚀","⚡","⚠️","ℹ️","❓","❗","🔒","🔓","🔑","💼","🏢","👥","👤","💬","📧","📞","🌐","🛠️","⚙️","🔧","✏️","🖊️","📖","📚","🎓","🏆","🎉","💯","👍","👎","🙌","🤝","💪","✨","🌟",
];

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const ToolbarButton = ({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`h-8 w-8 p-0 ${active ? "bg-muted" : ""}`}
  >
    {children}
  </Button>
);

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Sans Serif", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "ui-serif, Georgia, serif" },
  { label: "Monospace", value: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

const Toolbar = ({ editor }: { editor: Editor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt("Enter URL", editor.getAttributes("link").href || "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const uploadAndInsert = async (file: File, kind: "image" | "file") => {
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? "anon";
      const path = `${uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("wiki-files").upload(path, file);
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("wiki-files")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (sErr || !signed) throw sErr ?? new Error("Failed to sign URL");
      if (kind === "image") {
        editor.chain().focus().setImage({ src: signed.signedUrl, alt: file.name }).run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent(
            `<a href="${signed.signedUrl}" target="_blank" rel="noopener">📎 ${file.name}</a>`
          )
          .run();
      }
      toast.success("Uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addVideo = () => {
    const url = window.prompt("Enter video URL (YouTube, Vimeo, or any embeddable URL)");
    if (!url) return;
    if (/youtu\.?be/.test(url)) {
      editor.commands.setYoutubeVideo({ src: url, width: 640, height: 360 });
    } else {
      editor
        .chain()
        .focus()
        .insertContent(
          `<div class="my-4"><iframe src="${url}" class="w-full aspect-video rounded-md" frameborder="0" allowfullscreen></iframe></div>`
        )
        .run();
    }
  };

  const addEmbed = () => {
    const code = window.prompt("Paste embed HTML (iframe/script):");
    if (code) editor.chain().focus().insertContent(code).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const headingValue = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
    ? "h2"
    : editor.isActive("heading", { level: 3 })
    ? "h3"
    : "p";

  const currentFont = editor.getAttributes("textStyle").fontFamily || "";

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border">
      <div className="flex flex-wrap items-center gap-1 p-2 max-w-5xl mx-auto">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <Select
          value={headingValue}
          onValueChange={(val) => {
            if (val === "p") editor.chain().focus().setParagraph().unsetBold().run();
            else if (val === "h1") editor.chain().focus().toggleHeading({ level: 1 }).run();
            else if (val === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
            else if (val === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p">Paragraph</SelectItem>
            <SelectItem value="h1">Heading 1</SelectItem>
            <SelectItem value="h2">Heading 2</SelectItem>
            <SelectItem value="h3">Heading 3</SelectItem>

          </SelectContent>
        </Select>

        <Select
          value={currentFont || "__default"}
          onValueChange={(val) => {
            if (!val || val === "__default") editor.chain().focus().unsetFontFamily().run();
            else editor.chain().focus().setFontFamily(val).run();
          }}
        >
          <SelectTrigger className="w-36 h-8" title="Font family">
            <Type className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f.label} value={f.value || "__default"} onSelect={() => {}}>
                <span style={{ fontFamily: f.value || undefined }}>{f.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <div className="relative">
          <input
            type="color"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            value={editor.getAttributes("textStyle").color || "#000000"}
            className="w-8 h-8 p-1 cursor-pointer bg-transparent border-0"
            title="Text color"
          />
        </div>

        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().sinkListItem("listItem").run()} title="Increase indent">
          <Indent className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().liftListItem("listItem").run()} title="Decrease indent">
          <Outdent className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript">
          <SubIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript">
          <SupIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Image upload */}
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Insert image">
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadAndInsert(f, "image");
            e.target.value = "";
          }}
        />

        {/* File attachment */}
        <ToolbarButton onClick={() => attachInputRef.current?.click()} title="Attach file">
          <Paperclip className="h-4 w-4" />
        </ToolbarButton>
        <input
          ref={attachInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadAndInsert(f, "file");
            e.target.value = "";
          }}
        />

        {/* Video */}
        <ToolbarButton onClick={addVideo} title="Insert video (YouTube, Vimeo, URL)">
          <Video className="h-4 w-4" />
        </ToolbarButton>

        {/* Embed */}
        <ToolbarButton onClick={addEmbed} title="Embed code (iframe)">
          <CodeXml className="h-4 w-4" />
        </ToolbarButton>

        {/* Table */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Table">
              <TableIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 space-y-1">
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={insertTable}>
              <Plus className="h-4 w-4 mr-2" />Insert table (3×3)
            </Button>
            <div className="h-px bg-border my-1" />
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => editor.chain().focus().addRowAfter().run()}>
              <Plus className="h-4 w-4 mr-2" />Row below
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <Plus className="h-4 w-4 mr-2" />Column right
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => editor.chain().focus().deleteRow().run()}>
              <Minus className="h-4 w-4 mr-2" />Delete row
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => editor.chain().focus().deleteColumn().run()}>
              <Minus className="h-4 w-4 mr-2" />Delete column
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={() => editor.chain().focus().deleteTable().run()}>
              <Trash2 className="h-4 w-4 mr-2" />Delete table
            </Button>
          </PopoverContent>
        </Popover>

        {/* Emoji */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Emoji">
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-auto border-0" align="start">
            <Suspense fallback={<div className="p-4 text-sm">Loading…</div>}>
              <EmojiPicker
                onEmojiClick={(d: any) => editor.chain().focus().insertContent(d.emoji).run()}
                width={320}
                height={400}
              />
            </Suspense>
          </PopoverContent>
        </Popover>

        {/* Icon set */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Insert icon">
              <Sparkles className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="grid grid-cols-8 gap-1 text-lg">
              {ICON_SET.map((ico) => (
                <button
                  key={ico}
                  type="button"
                  className="hover:bg-muted rounded p-1"
                  onClick={() => editor.chain().focus().insertContent(ico).run()}
                >
                  {ico}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting">
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>



        {uploading && <span className="text-xs text-muted-foreground ml-2">Uploading…</span>}
      </div>
    </div>
  );
};

const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: { HTMLAttributes: { "data-bold": "true" } },
      }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      FontFamily,
      Color,
      Highlight,
      Subscript,
      Superscript,
      Youtube.configure({ controls: true, nocookie: true, HTMLAttributes: { class: "rounded-md my-4 mx-auto" } }),
      Table.configure({ resizable: true, HTMLAttributes: { class: "border-collapse table-auto w-full my-4" } }),
      TableRow,
      TableHeader.configure({ HTMLAttributes: { class: "border border-border bg-muted p-2 font-semibold text-left" } }),
      TableCell.configure({ HTMLAttributes: { class: "border border-border p-2" } }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[600px] py-8 prose-p:font-normal prose-li:font-normal prose-p:text-foreground",

      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      <Toolbar editor={editor} />
      <style>{`
        .wiki-editor-surface p,
        .wiki-editor-surface li,
        .wiki-editor-surface p strong,
        .wiki-editor-surface li strong,
        .wiki-editor-surface p b,
        .wiki-editor-surface li b,
        .wiki-editor-surface p span,
        .wiki-editor-surface li span {
          font-weight: 400 !important;
        }
        .wiki-editor-surface p [data-bold="true"],
        .wiki-editor-surface li [data-bold="true"] {
          font-weight: 700 !important;
        }
      `}</style>
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="max-w-4xl mx-auto bg-background min-h-full px-12 shadow-sm wiki-editor-surface">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
