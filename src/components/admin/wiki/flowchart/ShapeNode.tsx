import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Handle, NodeProps, Position } from "@xyflow/react";

export type Shape = "box" | "diamond" | "oval";

export interface ShapeNodeData {
  label: string;
  shape: Shape;
  onLabelChange?: (id: string, label: string) => void;
  readOnly?: boolean;
}

const shapeClasses: Record<Shape, string> = {
  box: "rounded-2xl",
  diamond: "rounded-md rotate-45",
  oval: "rounded-full",
};

const innerClasses: Record<Shape, string> = {
  box: "",
  diamond: "-rotate-45",
  oval: "",
};

const ShapeNode = ({ id, data, selected }: NodeProps) => {
  const d = data as unknown as ShapeNodeData;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(d.label);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setValue(d.label), [d.label]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (value !== d.label) d.onLabelChange?.(id, value);
  }, [value, d, id]);

  const shape = d.shape || "box";

  return (
    <div
      className={`relative bg-card border-2 ${
        selected ? "border-primary" : "border-border"
      } shadow-md flex items-center justify-center ${shapeClasses[shape]}`}
      style={{
        width: shape === "diamond" ? 160 : 200,
        height: shape === "diamond" ? 160 : 110,
      }}
      onDoubleClick={() => !d.readOnly && setEditing(true)}
    >
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <div className={`p-3 text-center text-sm font-medium text-foreground w-full ${innerClasses[shape]}`}>
        {editing ? (
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                setValue(d.label);
                setEditing(false);
              }
            }}
            className="w-full bg-transparent text-center outline-none resize-none"
            rows={2}
          />
        ) : (
          <span className="whitespace-pre-wrap break-words">{d.label || "Untitled"}</span>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  );
};

export default memo(ShapeNode);
