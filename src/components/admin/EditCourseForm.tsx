import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionManager from "./SectionManager";
import { Tables } from "@/integrations/supabase/types";

type Course = Tables<'courses'>;
type Level = Tables<'levels'>;
type Section = Tables<'sections'>;
type Unit = Tables<'units'>;

interface EditCourseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onCourseUpdated: () => void;
}

interface CourseFormData {
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  duration: string;
  image_url?: string;
}

interface SectionData {
  id?: string;
  title: string;
  description: string;
  sort_order: number;
  units: UnitData[];
}

interface UnitData {
  id?: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  duration_minutes: number;
  sort_order: number;
}

const EditCourseForm = ({ open, onOpenChange, course, onCourseUpdated }: EditCourseFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sections, setSections] = useState<SectionData[]>([]);
  const { toast } = useToast();
  
  const form = useForm<CourseFormData>({
    defaultValues: {
      title: "",
      description: "",
      instructor: "",
      category: "",
      level: "",
      duration: "",
      image_url: "",
    },
  });

  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Level[];
    },
  });

  // Fetch course sections and units when course changes
  useEffect(() => {
    const fetchCourseSections = async () => {
      if (!course?.id) return;

      try {
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('sections')
          .select(`
            *,
            units:units(*)
          `)
          .eq('course_id', course.id)
          .order('sort_order', { ascending: true });

        if (sectionsError) throw sectionsError;

        const formattedSections: SectionData[] = sectionsData?.map(section => ({
          id: section.id,
          title: section.title,
          description: section.description || "",
          sort_order: section.sort_order,
          units: (section.units as Unit[])?.map(unit => ({
            id: unit.id,
            title: unit.title,
            description: unit.description || "",
            content: unit.content || "",
            video_url: unit.video_url || "",
            duration_minutes: unit.duration_minutes || 0,
            sort_order: unit.sort_order,
          })).sort((a, b) => a.sort_order - b.sort_order) || []
        })).sort((a, b) => a.sort_order - b.sort_order) || [];

        setSections(formattedSections);
      } catch (error) {
        console.error('Error fetching course sections:', error);
      }
    };

    if (course && open) {
      form.reset({
        title: course.title,
        description: course.description || "",
        instructor: course.instructor,
        category: course.category,
        level: course.level,
        duration: course.duration,
        image_url: course.image_url || "",
      });
      fetchCourseSections();
    }
  }, [course, open, form]);

  const onSubmit = async (data: CourseFormData) => {
    if (!course) return;
    
    setIsSubmitting(true);
    try {
      // Update the course
      const { error: courseError } = await supabase
        .from('courses')
        .update({
          title: data.title,
          description: data.description,
          instructor: data.instructor,
          category: data.category,
          level: data.level,
          duration: data.duration,
          image_url: data.image_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', course.id);

      if (courseError) throw courseError;

      // Delete existing sections and units (CASCADE will handle units)
      const { error: deleteError } = await supabase
        .from('sections')
        .delete()
        .eq('course_id', course.id);

      if (deleteError) throw deleteError;

      // Create new sections and units
      if (sections.length > 0) {
        for (const section of sections) {
          const { data: sectionData, error: sectionError } = await supabase
            .from('sections')
            .insert([{
              course_id: course.id,
              title: section.title,
              description: section.description,
              sort_order: section.sort_order,
            }])
            .select()
            .single();

          if (sectionError) throw sectionError;

          // Create units for this section
          if (section.units.length > 0) {
            const unitsToInsert = section.units.map(unit => ({
              section_id: sectionData.id,
              title: unit.title,
              description: unit.description,
              content: unit.content,
              video_url: unit.video_url || null,
              duration_minutes: unit.duration_minutes,
              sort_order: unit.sort_order,
            }));

            const { error: unitsError } = await supabase
              .from('units')
              .insert(unitsToInsert);

            if (unitsError) throw unitsError;
          }
        }
      }

      toast({
        title: "Success",
        description: "Course updated successfully",
      });

      onOpenChange(false);
      onCourseUpdated();
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="content">Course Content</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  rules={{ required: "Title is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Course title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  rules={{ required: "Description is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Course description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructor"
                  rules={{ required: "Instructor is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructor</FormLabel>
                      <FormControl>
                        <Input placeholder="Instructor name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  rules={{ required: "Category is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Course category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="level"
                  rules={{ required: "Level is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {levels.map((level) => (
                            <SelectItem key={level.id} value={level.code}>
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  rules={{ required: "Duration is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2 hours" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <SectionManager
                  sections={sections}
                  onSectionsChange={setSections}
                />
              </TabsContent>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Course"}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditCourseForm;
