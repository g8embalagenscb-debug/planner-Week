import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();
    
    console.log("Generating posts for company:", companyId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch company details
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      throw new Error("Company not found");
    }

    console.log("Company found:", company.name);

    // Fetch history posts to avoid repetition
    const { data: historyPosts } = await supabase
      .from("history_posts")
      .select("title, theme, caption")
      .eq("company_id", companyId)
      .order("posted_at", { ascending: false })
      .limit(50);

    // Calculate next week start (next Monday)
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
    const weekStart = nextMonday.toISOString().split("T")[0];

    console.log("Generating posts for week starting:", weekStart);

    // Check if posts already exist for this week
    const { data: existingPosts } = await supabase
      .from("weekly_posts")
      .select("id")
      .eq("company_id", companyId)
      .eq("week_start", weekStart)
      .limit(1);

    if (existingPosts && existingPosts.length > 0) {
      return new Response(
        JSON.stringify({ error: "Posts already generated for this week" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build history context
    const historyContext = historyPosts && historyPosts.length > 0
      ? historyPosts.map(p => `- Título: "${p.title}", Tema: "${p.theme || 'não especificado'}", Legenda: "${p.caption.substring(0, 100)}..."`).join("\n")
      : "Nenhum histórico disponível ainda.";

    // Check for special dates (Brazilian holidays + city)
    const specialDatesPrompt = company.city 
      ? `Verifique se há alguma data comemorativa nacional brasileira ou específica da cidade de ${company.city} nesta semana. Se houver, crie UM post extra marcado como data especial.`
      : `Verifique se há alguma data comemorativa nacional brasileira nesta semana. Se houver, crie UM post extra marcado como data especial.`;

    // Generate posts using Lovable AI
    const systemPrompt = `Você é um especialista em marketing de conteúdo para redes sociais. Sua tarefa é gerar ideias criativas, variadas e autênticas de posts para Instagram.

IMPORTANTE: Retorne APENAS um objeto JSON válido, sem texto adicional antes ou depois.`;

    const userPrompt = `Gere ideias de posts para a empresa "${company.name}", que é do nicho "${company.niche}", para a semana iniciando em ${weekStart}.

A empresa publica ${company.posts_per_week} posts por semana.

HISTÓRICO DE POSTS JÁ UTILIZADOS (NÃO REPETIR):
${historyContext}

${specialDatesPrompt}

Para cada post, gere:
- title: título curto e chamativo
- image_description: descrição detalhada do que deve conter na imagem (seja específico sobre cores, elementos, estilo)
- format: escolha entre "foto", "carrossel", "video" ou "story"
- caption: legenda completa com emojis, call-to-action e hashtags relevantes (máximo 2200 caracteres)
- theme: tema principal do post
- is_special_date: true se for data comemorativa, false caso contrário

REGRAS:
1. Seja MUITO criativo e evite repetir ideias, temas ou estruturas do histórico
2. Varie os formatos (foto, carrossel, vídeo, story)
3. Crie legendas engajadoras com personalidade
4. Use emojis de forma natural
5. Inclua call-to-action apropriados
6. Adicione 5-8 hashtags relevantes no final da legenda
7. Se houver data especial, marque como is_special_date: true

Retorne um objeto JSON com esta estrutura EXATA:
{
  "posts": [
    {
      "title": "string",
      "image_description": "string",
      "format": "foto|carrossel|video|story",
      "caption": "string",
      "theme": "string",
      "is_special_date": false
    }
  ]
}`;

    console.log("Calling AI to generate posts...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de uso da IA atingido. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;
    
    console.log("AI response received, parsing...");

    // Extract JSON from response (in case AI adds extra text)
    let postsData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        postsData = JSON.parse(jsonMatch[0]);
      } else {
        postsData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    if (!postsData.posts || !Array.isArray(postsData.posts)) {
      throw new Error("Invalid AI response format");
    }

    // Ensure we have the right number of posts
    const posts = postsData.posts.slice(0, company.posts_per_week + 2); // +2 for potential special date

    console.log(`Inserting ${posts.length} posts into database...`);

    // Insert posts into weekly_posts table
    const postsToInsert = posts.map((post: any) => ({
      company_id: companyId,
      week_start: weekStart,
      title: post.title,
      image_description: post.image_description,
      format: post.format,
      caption: post.caption,
      status: "pending",
      is_special_date: post.is_special_date || false,
    }));

    const { error: insertError } = await supabase
      .from("weekly_posts")
      .insert(postsToInsert);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    console.log("Posts generated successfully!");

    return new Response(
      JSON.stringify({ 
        success: true, 
        postsCount: posts.length,
        weekStart 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-posts function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});