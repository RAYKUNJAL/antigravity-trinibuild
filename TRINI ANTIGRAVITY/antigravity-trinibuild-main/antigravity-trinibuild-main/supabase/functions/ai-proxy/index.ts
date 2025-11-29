import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const AI_SERVER_URL = Deno.env.get('AI_SERVER_URL') || 'http://localhost:8000';

serve(async (req) => {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Authenticate User
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        // 2. (Optional) Check Credits/Subscription here
        // const { data: profile } = await supabaseClient.from('profiles').select('credits').eq('id', user.id).single();
        // if (profile.credits < 1) throw new Error("Insufficient credits");

        // 3. Proxy to AI Server
        const { pathname } = new URL(req.url);
        // Extract the endpoint part (e.g., /ai-proxy/generate-job-letter -> /generate-job-letter)
        // Note: Supabase routing might be /ai-proxy, so we might need to pass the target endpoint in the body or query param.
        // For simplicity, let's assume the body contains the 'endpoint' or we map based on a query param.
        // OR, we can just forward the body to the specific AI server endpoint if we make this function generic.

        // Let's expect the client to send the target endpoint in the URL query or body, 
        // BUT for security, it's better to have specific logic.
        // Let's assume this function handles all AI requests and dispatches based on a 'type' field in the body.

        const body = await req.json();
        let targetEndpoint = "";

        if (body.action === 'generate-job-letter') targetEndpoint = "/generate-job-letter";
        else if (body.action === 'generate-listing-description') targetEndpoint = "/generate-listing-description";
        else if (body.action === 'chatbot-reply') targetEndpoint = "/chatbot-reply";
        else throw new Error("Invalid action");

        const aiResponse = await fetch(`${AI_SERVER_URL}${targetEndpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body.payload),
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            throw new Error(`AI Server Error: ${errorText}`);
        }

        const aiData = await aiResponse.json();

        // 4. (Optional) Deduct credits here if successful

        return new Response(JSON.stringify(aiData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
