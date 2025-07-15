import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: string;
  publishDate: string;
  guid: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching podcast RSS feed...');
    
    // Fetch the RSS feed
    const response = await fetch('https://rss.com/podcasts/letsgetrich/feed.xml');
    
    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }
    
    const xmlText = await response.text();
    console.log('RSS feed fetched successfully');
    
    // Parse XML using DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    
    // Check for parsing errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML parsing failed');
    }
    
    // Extract episode data
    const items = doc.querySelectorAll('item');
    const episodes: PodcastEpisode[] = [];
    
    items.forEach((item, index) => {
      const title = item.querySelector('title')?.textContent?.trim() || '';
      const description = item.querySelector('description')?.textContent?.trim() || '';
      const guid = item.querySelector('guid')?.textContent?.trim() || `episode-${index}`;
      const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
      
      // Find the audio enclosure
      const enclosure = item.querySelector('enclosure[type*="audio"]');
      const audioUrl = enclosure?.getAttribute('url') || '';
      
      // Try to get duration from iTunes tags or other sources
      const itunesDuration = item.querySelector('duration')?.textContent?.trim() ||
                           item.querySelector('itunes\\:duration')?.textContent?.trim() ||
                           '';
      
      if (title && audioUrl) {
        episodes.push({
          id: guid,
          title,
          description: description.replace(/<[^>]*>/g, ''), // Strip HTML tags
          audioUrl,
          duration: itunesDuration,
          publishDate: pubDate,
          guid
        });
      }
    });
    
    console.log(`Parsed ${episodes.length} episodes`);
    
    return new Response(
      JSON.stringify({ episodes }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (error) {
    console.error('Error fetching podcast episodes:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch podcast episodes',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
})