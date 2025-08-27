// Fix: Add Deno types reference to make the Deno global object available
/// <reference types="https://esm.sh/@types/deno@1.40.1" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push';

// It is crucial to set these as environment variables in your Supabase project settings.
// DO NOT hardcode them here.
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_MAILTO = Deno.env.get('VAPID_MAILTO')!; // e.g., 'mailto:admin@example.com'

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_MAILTO) {
  console.error("VAPID keys are not set in environment variables.");
} else {
    webpush.setVapidDetails(
      VAPID_MAILTO,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response('User ID is required', { status: 400 });
    }

    // Create a Supabase client with the service role key to bypass RLS.
    // Ensure you have set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your function's environment variables.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch user details to personalize the notification
    const { data: userData, error: userError } = await supabaseAdmin
      .from('passcodes')
      .select('name, path')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user data:', userError?.message);
      return new Response('User not found', { status: 404 });
    }

    // Fetch all push subscriptions for the given user ID.
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription_data, endpoint_url')
      .eq('user_id', userId);

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError.message);
      throw subsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}.`);
      return new Response(JSON.stringify({ success: true, message: 'No subscriptions to notify.' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Define the notification payload.
    const notificationPayload = JSON.stringify({
      title: 'Application Approved! 🎉',
      body: `Congratulations, ${userData.name}! Your application for the ${userData.path} program has been approved.`,
    });

    // Send a push notification to each subscription.
    const promises = subscriptions.map(sub =>
      webpush.sendNotification(
        sub.subscription_data,
        notificationPayload
      ).catch(async (error) => {
        console.error('Error sending notification, status code:', error.statusCode);
        // If the subscription is expired or invalid (410 Gone), remove it from the database.
        if (error.statusCode === 410) {
          console.log(`Subscription ${sub.endpoint_url} expired. Deleting from DB.`);
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('endpoint_url', sub.endpoint_url);
        }
      })
    );

    await Promise.all(promises);

    return new Response(JSON.stringify({ success: true, message: `Sent ${promises.length} notifications.` }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Function error:', err.message);
    return new Response(String(err?.message ?? err), { status: 500 });
  }
});
