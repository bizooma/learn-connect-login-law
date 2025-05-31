
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import UnitManager from './UnitManager';
import { UnitData } from './types';

interface DraggableUnitManagerProps {
  unit: UnitData;
  unitIndex: number;
  sectionIndex: number;
  onUpdateUnit: (sectionIndex: number, unitIndex: number, field: keyof UnitData, value: any) => void;
  onDeleteUnit: (sectionIndex: number, unitIndex: number) => void;
  onVideoFileChange: (sectionIndex: number, unitIndex: number, file: File | null) => void;
}

const DraggableUnitManager = (props: DraggableUnitManagerProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `unit-${props.sectionIndex}-${props.unitIndex}`,
    data: {
      type: 'unit',
      sectionIndex: props.sectionIndex,
      unitIndex: props.unitIndex,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <UnitManager
        {...props}
        dragHandleProps={listeners}
        isDragging={isDragging}
      />
    </div>
  );
};

export default DraggableUnitManager;
