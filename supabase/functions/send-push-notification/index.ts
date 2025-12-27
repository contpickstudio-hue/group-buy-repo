// Supabase Edge Function: send-push-notification
// This function sends push notifications via FCM (Android) and APNs (iOS)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

interface DeviceToken {
  device_token: string;
  platform: 'ios' | 'android' | 'web';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const payload: PushNotificationPayload = await req.json();
    const { userId, title, body, data = {}, badge, sound = 'default' } = payload;

    // Validate required fields
    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get all active device tokens for the user
    const { data: devices, error: devicesError } = await supabase
      .from('user_devices')
      .select('device_token, platform')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (devicesError) {
      throw new Error(`Failed to fetch devices: ${devicesError.message}`);
    }

    if (!devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active devices found for user',
          sent: 0 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get FCM V1 and APNs credentials from environment
    const fcmProjectId = Deno.env.get('FCM_PROJECT_ID');
    const fcmServiceAccountKeyBase64 = Deno.env.get('FCM_SERVICE_ACCOUNT_KEY_BASE64');
    const fcmServiceAccountKey = fcmServiceAccountKeyBase64 
      ? atob(fcmServiceAccountKeyBase64) // Decode base64 if provided
      : Deno.env.get('FCM_SERVICE_ACCOUNT_KEY'); // Or use direct JSON string
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY'); // Legacy fallback
    const apnsKeyId = Deno.env.get('APNS_KEY_ID');
    const apnsTeamId = Deno.env.get('APNS_TEAM_ID');
    const apnsBundleId = Deno.env.get('APNS_BUNDLE_ID') || 'com.koreancommerce.app';
    const apnsKey = Deno.env.get('APNS_KEY'); // Base64 encoded .p8 key

    let sentCount = 0;
    const errors: string[] = [];

    // Get OAuth2 access token for FCM V1 API (if using service account)
    let fcmAccessToken: string | null = null;
    if (fcmServiceAccountKey && fcmProjectId) {
      try {
        fcmAccessToken = await getFCMAccessToken(fcmServiceAccountKey);
      } catch (error) {
        console.error('Failed to get FCM access token:', error);
        errors.push('Failed to authenticate with FCM V1 API');
      }
    }

    // Send notifications to each device
    for (const device of devices as DeviceToken[]) {
      try {
        if (device.platform === 'android') {
          if (fcmAccessToken && fcmProjectId) {
            // Use FCM V1 API (recommended)
            const fcmResponse = await fetch(
              `https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${fcmAccessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  message: {
                    token: device.device_token,
                    notification: {
                      title,
                      body,
                    },
                    data: {
                      ...data,
                      sound: sound || 'default',
                      badge: badge?.toString() || '0',
                    },
                    android: {
                      priority: 'high',
                      notification: {
                        sound: sound || 'default',
                        channelId: 'default',
                      },
                    },
                  },
                }),
              }
            );

            if (!fcmResponse.ok) {
              const errorText = await fcmResponse.text();
              errors.push(`FCM V1 error for ${device.device_token}: ${errorText}`);
            } else {
              sentCount++;
            }
          } else if (fcmServerKey) {
            // Fallback to legacy FCM API
            const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
              method: 'POST',
              headers: {
                'Authorization': `key=${fcmServerKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: device.device_token,
                notification: {
                  title,
                  body,
                  sound,
                  badge,
                },
                data: {
                  ...data,
                  click_action: 'FLUTTER_NOTIFICATION_CLICK',
                },
                priority: 'high',
              }),
            });

            if (!fcmResponse.ok) {
              const errorText = await fcmResponse.text();
              errors.push(`FCM legacy error for ${device.device_token}: ${errorText}`);
            } else {
              sentCount++;
            }
          } else {
            errors.push('Missing FCM credentials for Android device');
          }
        } else if (device.platform === 'ios' && apnsKeyId && apnsTeamId && apnsKey) {
          // Send via APNs for iOS
          // Note: This is a simplified implementation
          // For production, you should use a proper APNs library or service
          const apnsUrl = `https://api.push.apple.com/3/device/${device.device_token}`;
          
          // Create JWT token for APNs authentication
          // This is a placeholder - you'll need to implement proper JWT signing
          const jwtToken = await generateAPNsJWT(apnsKeyId, apnsTeamId, apnsKey);
          
          const apnsResponse = await fetch(apnsUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${jwtToken}`,
              'Content-Type': 'application/json',
              'apns-topic': apnsBundleId,
              'apns-priority': '10',
              'apns-push-type': 'alert',
            },
            body: JSON.stringify({
              aps: {
                alert: {
                  title,
                  body,
                },
                sound,
                badge,
                'content-available': 1,
              },
              ...data,
            }),
          });

          if (!apnsResponse.ok) {
            const errorText = await apnsResponse.text();
            errors.push(`APNs error for ${device.device_token}: ${errorText}`);
          } else {
            sentCount++;
          }
        } else {
          errors.push(`Missing credentials for platform: ${device.platform}`);
        }
      } catch (error) {
        errors.push(`Error sending to ${device.device_token}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        total: devices.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send push notification',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper function to get OAuth2 access token for FCM V1 API
async function getFCMAccessToken(serviceAccountKeyJson: string): Promise<string> {
  try {
    const serviceAccount = JSON.parse(serviceAccountKeyJson);
    const { client_email, private_key } = serviceAccount;

    // Create JWT for OAuth2
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const jwtPayload = {
      iss: client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Sign JWT (simplified - in production use a proper JWT library)
    // For Deno, we'll use the Web Crypto API
    const jwt = await createJWT(jwtHeader, jwtPayload, private_key);

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting FCM access token:', error);
    throw error;
  }
}

// Helper function to create JWT using Web Crypto API
async function createJWT(header: any, payload: any, privateKey: string): Promise<string> {
  // Import the private key
  const keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  // Sign
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

// Helper function to generate APNs JWT token
// Note: This is a simplified version. For production, use a proper JWT library
async function generateAPNsJWT(keyId: string, teamId: string, key: string): Promise<string> {
  // This is a placeholder - you'll need to implement proper JWT signing
  // using the APNs .p8 key file
  // For now, return a placeholder token
  // In production, use a library like 'https://deno.land/x/djwt@v2.4/mod.ts'
  
  // Placeholder implementation - replace with actual JWT signing
  const header = {
    alg: 'ES256',
    kid: keyId,
  };
  
  const payload = {
    iss: teamId,
    iat: Math.floor(Date.now() / 1000),
  };

  // TODO: Implement actual JWT signing with ES256 algorithm
  // For now, this will fail - you need to properly sign the JWT
  return 'PLACEHOLDER_JWT_TOKEN';
}
