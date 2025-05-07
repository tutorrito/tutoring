import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
// Debug log all available environment variables
console.log("Available environment variables:", Deno.env.toObject());

// Load environment variables with multiple fallbacks
let resendApiKey = Deno.env.get("RESEND_API_KEY") || 
                  Deno.env.get("RESEND_API_KEY\r") || // Handle Windows line endings
                  Deno.env.get("RESEND_API_KEY\n") || // Handle Unix line endings
                  Deno.env.get("RESEND_API_KEY\r\n"); // Handle CRLF

if (!resendApiKey) {
  console.error("RESEND_API_KEY not found in environment variables. Available keys:", 
    Array.from(Deno.env.keys()));
  throw new Error("Email service configuration error - missing API key. Please ensure RESEND_API_KEY is set in your environment variables.");
}

// Clean up potential line ending artifacts
resendApiKey = resendApiKey.trim();

let resend;
try {
  resend = new Resend(resendApiKey);
  console.log("Resend client initialized successfully");
} catch (err) {
  console.error("Failed to initialize Resend client:", err);
  throw new Error("Email service configuration error - invalid API key");
}
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const handler = async (req: Request): Promise<Response> => {
  // Verify request URL
  const url = new URL(req.url);
  if (!url.pathname.endsWith('/send-email')) {
    return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { to, subject, html, from = "Contact System <onboarding@resend.dev>", replyTo, text, metadata = {}, tags = [], trackOpens = true, trackClicks = true } = await req.json();
    console.log(`Sending email to ${Array.isArray(to) ? to.join(", ") : to}`);
    // Generate a unique ID for this email
    const emailId = crypto.randomUUID();
    // Add tracking pixel if trackOpens is enabled
    const trackingPixel = trackOpens ? `<img src="https://yuyntfqmarmjwolrwqkf.functions.supabase.co/track-email-events?event=open&email=${emailId}" width="1" height="1" />` : '';
    // Combine the original HTML with the tracking pixel
    const htmlWithTracking = `${html}${trackingPixel}`;
    // Add timeout for email sending
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const emailResponse = await resend.emails.send({
      signal: controller.signal,
      from,
      to,
      subject,
      html: htmlWithTracking,
      text,
      reply_to: replyTo,
      // Add analytics tracking
      tags: [
        {
          name: "category",
          value: "crm_email"
        },
        ...Array.isArray(tags) ? tags : []
      ],
      // Add metadata for better analytics
      metadata: {
        email_id: emailId,
        sent_timestamp: new Date().toISOString(),
        ...metadata
      }
    });
    console.log("Email sent successfully:", emailResponse);
    // Store the initial send event
    try {
      const trackResponse = await fetch('https://yuyntfqmarmjwolrwqkf.functions.supabase.co/track-email-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'send',
          data: {
            email_id: emailId,
            recipient: Array.isArray(to) ? to[0] : to,
            timestamp: new Date().toISOString()
          }
        })
      });
      if (!trackResponse.ok) {
        console.error('Failed to track send event:', await trackResponse.text());
      }
    } catch (trackError) {
      console.error('Error tracking send event:', trackError);
    }
    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error in send-email function:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    let status = 500;
    let errorMessage = err.message;
    
    if (err.name === 'AbortError') {
      status = 504;
      errorMessage = "Email service timeout";
    } else if (err.message.includes('Failed to fetch')) {
      status = 502;
      errorMessage = "Email service unavailable";
    }
    
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
};
serve(handler);
