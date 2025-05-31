
import { useParams } from "react-router-dom";
import SectionHeader from "@/components/section/SectionHeader";
import SectionLoading from "@/components/section/SectionLoading";
import SectionNotFound from "@/components/section/SectionNotFound";
import SectionMainContent from "@/components/section/SectionMainContent";
import { useSection } from "@/hooks/useSection";

const Section = () => {
  const { id } = useParams<{ id: string }>();
  const { section, selectedUnit, setSelectedUnit, loading } = useSection(id);

  if (loading) {
    return <SectionLoading />;
  }

  if (!section) {
    return <SectionNotFound />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SectionHeader section={section} />
      <SectionMainContent
        sectionId={section.id}
        units={section.units}
        selectedUnit={selectedUnit}
        onUnitSelect={setSelectedUnit}
      />
    </div>
  );
};

export default Section;
