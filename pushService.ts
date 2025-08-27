import { supabase } from './supabaseClient';
import { VAPID_PUBLIC_KEY } from './constants';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function getSubscription(): Promise<PushSubscription | null> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const registration = await navigator.serviceWorker.ready;
            return registration.pushManager.getSubscription();
        } catch (error) {
            console.error("Error getting service worker registration:", error);
            return null;
        }
    }
    return null;
}

export async function subscribeUser(userId: string): Promise<PushSubscription> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push messaging is not supported by this browser.');
    }

    if (VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY_HERE') {
        throw new Error('VAPID public key not configured. Please generate keys and update constants.ts.');
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        return subscription;
    }

    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
    });

    // Send subscription to backend
    const { error } = await supabase
        .from('push_subscriptions')
        .insert({
            user_id: userId,
            subscription_data: subscription.toJSON()
        });
    
    if (error) {
        // If it fails, unsubscribe the user locally to avoid a broken state
        await subscription.unsubscribe();
        console.error('Failed to save subscription:', error);
        throw new Error('Failed to save push subscription to the server.');
    }

    return subscription;
}

export async function unsubscribeUser() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        // First, remove from backend
        const endpoint = subscription.endpoint;
        const { error } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint_url', endpoint);
        
        if (error) {
            console.error('Failed to delete subscription from server:', error);
            // We'll proceed to unsubscribe locally anyway
        }

        await subscription.unsubscribe();
    }
}
