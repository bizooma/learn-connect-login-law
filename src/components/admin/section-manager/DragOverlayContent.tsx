
interface DragOverlayContentProps {
  activeId: string | null;
  activeItem: any;
}

const DragOverlayContent = ({ activeId, activeItem }: DragOverlayContentProps) => {
  if (!activeId || !activeItem) return null;

  return (
    <div className="opacity-90 rotate-3 shadow-lg">
      {activeItem.title ? (
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium">{activeItem.title}</h4>
          <p className="text-sm text-gray-600">{activeItem.description}</p>
        </div>
      ) : null}
    </div>
  );
};

export default DragOverlayContent;
