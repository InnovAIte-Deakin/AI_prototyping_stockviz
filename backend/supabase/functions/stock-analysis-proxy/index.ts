
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { symbol, exchange } = await req.json();
    
    if (!symbol || !exchange) {
      return new Response(
        JSON.stringify({ error: "Symbol and exchange are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing request for symbol: ${symbol}, exchange: ${exchange}`);

    // Create Supabase client with the project URL and service_role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Check if we have a cached result (less than 1 hour old)
    const { data: cachedData, error: cacheError } = await supabaseAdmin
      .from('stock_analysis_cache')
      .select('*')
      .eq('symbol', symbol)
      .eq('exchange', exchange)
      .gt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cacheError) {
      console.log("Cache error:", cacheError.message);
    }

    if (cachedData) {
      console.log("Serving cached analysis for", symbol);
      return new Response(
        JSON.stringify({
          url: "https://placeholder-chart.com/cached",
          text: cachedData.analysis_text,
          symbol: symbol
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Forward to actual API - updated with new endpoint
    const apiUrl = "https://kingaakash.app.n8n.cloud/webhook/stock-chart-analysis";
    console.log(`Forwarding request to API: ${apiUrl}`);
    
    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "StockAnalysisClient/1.0" 
      },
      body: JSON.stringify({ symbol, exchange }),
    });

    console.log(`API response status: ${apiResponse.status}`);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`API error: ${apiResponse.status}, Response: ${errorText}`);
      throw new Error(`API responded with status: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    console.log("Received valid response from API");
    
    // Cache the result in Supabase (only store analysis_text now)
    const { error: insertError } = await supabaseAdmin.from('stock_analysis_cache').insert({
      symbol: symbol,
      exchange: exchange,
      analysis_text: data.text,
    });

    if (insertError) {
      console.error("Error caching result:", insertError.message);
    }

    return new Response(JSON.stringify(data), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("Error in edge function:", error.message);
    
    // Return mock data on error
    return new Response(
      JSON.stringify({
        url: "https://placeholder-chart.com/error",
        text: `# Mock Analysis\n\n## Due to API Connection Issues\n\nWe're currently experiencing difficulties connecting to our analysis service. Please try again later.\n\n### What You Can Do\n\n- Try refreshing the page\n- Check your internet connection\n- Try again in a few minutes\n\nError details: ${error.message}`,
        symbol: "error"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
