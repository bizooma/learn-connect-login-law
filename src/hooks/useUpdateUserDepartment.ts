import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useUpdateUserDepartment = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      department,
    }: {
      userId: string;
      department: string | null;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ department })
        .eq("id", userId);
      if (error) throw error;
      return { userId, department };
    },
    onMutate: async ({ userId, department }) => {
      await qc.cancelQueries({ queryKey: ["people-by-department"] });
      const previous = qc.getQueryData<Record<string, any[]>>(["people-by-department"]);
      if (previous) {
        const next: Record<string, any[]> = {};
        let moved: any | null = null;
        for (const [k, arr] of Object.entries(previous)) {
          next[k] = [];
          for (const p of arr) {
            if (p.id === userId) {
              moved = { ...p, department };
            } else {
              next[k].push(p);
            }
          }
        }
        if (moved) {
          const target = department ?? "Unassigned";
          if (!next[target]) next[target] = [];
          next[target] = [...next[target], moved].sort((a, b) =>
            (a.first_name ?? "").localeCompare(b.first_name ?? "")
          );
        }
        qc.setQueryData(["people-by-department"], next);
      }
      return { previous };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["people-by-department"], ctx.previous);
      toast({
        title: "Failed to move staff member",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: ({ department }) => {
      toast({
        title: "Department updated",
        description: `Moved to ${department ?? "Unassigned"}.`,
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["people-by-department"] });
    },
  });
};
