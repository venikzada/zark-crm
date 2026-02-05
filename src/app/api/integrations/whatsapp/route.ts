import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// WhatsApp Cloud API configuration
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

// Send verification code
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { phoneNumber, action } = body;

        if (action === 'verify') {
            // Generate verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Store code in database (expires in 10 minutes)
            await supabase
                .from('verification_codes')
                .upsert({
                    user_id: user.id,
                    phone_number: phoneNumber,
                    code: verificationCode,
                    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                });

            // Send WhatsApp message with code (using WhatsApp Cloud API)
            if (WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
                await fetch(
                    `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            messaging_product: 'whatsapp',
                            to: phoneNumber.replace(/\D/g, ''),
                            type: 'template',
                            template: {
                                name: 'verification_code',
                                language: { code: 'pt_BR' },
                                components: [
                                    {
                                        type: 'body',
                                        parameters: [
                                            { type: 'text', text: verificationCode },
                                        ],
                                    },
                                ],
                            },
                        }),
                    }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Verification code sent',
                // For demo purposes, return the code
                // In production, remove this
                demo_code: verificationCode,
            });
        }

        if (action === 'confirm') {
            const { code } = body;

            // Verify code
            const { data: verification } = await supabase
                .from('verification_codes')
                .select('*')
                .eq('user_id', user.id)
                .eq('phone_number', phoneNumber)
                .eq('code', code)
                .gt('expires_at', new Date().toISOString())
                .single();

            if (!verification) {
                return NextResponse.json(
                    { error: 'Invalid or expired code' },
                    { status: 400 }
                );
            }

            // Save WhatsApp integration
            await supabase
                .from('user_integrations')
                .upsert({
                    user_id: user.id,
                    provider: 'whatsapp',
                    provider_user_id: phoneNumber,
                    metadata: {
                        phone_number: phoneNumber,
                        verified_at: new Date().toISOString(),
                    },
                }, {
                    onConflict: 'user_id,provider',
                });

            // Delete verification code
            await supabase
                .from('verification_codes')
                .delete()
                .eq('user_id', user.id);

            return NextResponse.json({ success: true, message: 'WhatsApp connected' });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );

    } catch (err) {
        console.error('WhatsApp API error:', err);
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}

// Disconnect WhatsApp
export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }

    const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'whatsapp');

    if (error) {
        return NextResponse.json(
            { error: 'Failed to disconnect' },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
