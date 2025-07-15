import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: string;
  publishDate: string;
  guid: string;
}

export const usePodcastEpisodes = () => {
  return useQuery({
    queryKey: ["podcast-episodes"],
    queryFn: async (): Promise<PodcastEpisode[]> => {
      const { data, error } = await supabase.functions.invoke('fetch-podcast-episodes');
      
      if (error) {
        console.error('Error fetching podcast episodes:', error);
        throw new Error('Failed to fetch podcast episodes');
      }
      
      return data.episodes || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });
};