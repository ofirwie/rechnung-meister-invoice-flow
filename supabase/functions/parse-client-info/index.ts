import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text?.trim()) {
      return new Response(JSON.stringify({}), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Basic regex parsing fallback
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/;
    const phoneRegex = /[\+]?[\d\-\(\)\s]{10,}/;
    
    let parsedData: any = {};

    // Extract email
    const emailMatch = text.match(emailRegex);
    if (emailMatch) parsedData.email = emailMatch[0];

    // Extract phone
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) parsedData.phone = phoneMatch[0].replace(/\s+/g, ' ').trim();

    // Use OpenAI if key is available
    if (openAIApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Extract client information from the given text and return a JSON object with these fields: companyName, contactName, address, city, postalCode, email, phone, taxId, businessLicense, companyRegistration. Only include fields that are clearly identifiable. Return only valid JSON.'
              },
              {
                role: 'user',
                content: text
              }
            ],
            temperature: 0.1,
            max_tokens: 500
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResult = JSON.parse(data.choices[0].message.content);
          parsedData = { ...parsedData, ...aiResult };
        }
      } catch (error) {
        console.error('OpenAI parsing failed, using basic parsing:', error);
      }
    }

    // Basic parsing fallback for company name
    if (!parsedData.companyName) {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length > 0) parsedData.companyName = lines[0].trim();
    }

    // Filter out empty values
    const cleanedData = Object.fromEntries(
      Object.entries(parsedData).filter(([_, value]) => value && value.toString().trim())
    );

    return new Response(JSON.stringify(cleanedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in parse-client-info function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});