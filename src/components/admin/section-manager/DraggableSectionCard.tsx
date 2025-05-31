
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SectionCard from './SectionCard';
import { UnitData, SectionData } from './types';

interface DraggableSectionCardProps {
  section: SectionData;
  sectionIndex: number;
  isExpanded: boolean;
  onToggleExpanded: (index: number) => void;
  onUpdateSection: (index: number, field: keyof SectionData, value: any) => void;
  onDeleteSection: (index: number) => void;
  onAddUnit: (sectionIndex: number) => void;
  onUpdateUnit: (sectionIndex: number, unitIndex: number, field: keyof UnitData, value: any) => void;
  onDeleteUnit: (sectionIndex: number, unitIndex: number) => void;
  onVideoFileChange: (sectionIndex: number, unitIndex: number, file: File | null) => void;
  onSectionImageUpdate: (sectionIndex: number, imageUrl: string | null) => void;
}

const DraggableSectionCard = (props: DraggableSectionCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `section-${props.sectionIndex}`,
    data: {
      type: 'section',
      index: props.sectionIndex,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <SectionCard
        {...props}
        dragHandleProps={listeners}
        isDragging={isDragging}
      />
    </div>
  );
};

export default DraggableSectionCard;
