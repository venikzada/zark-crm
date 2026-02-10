import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Admin client for storage operations to bypass RLS on upload
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        let supabaseAdmin = null;

        if (serviceRoleKey) {
            supabaseAdmin = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );
        } else {
            console.error("CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.");
            return NextResponse.json(
                {
                    error: 'Server Configuration Error',
                    details: 'Missing SUPABASE_SERVICE_ROLE_KEY. Please add this to your Vercel project settings.'
                },
                { status: 500 }
            );
        }

        // ... (user check) ...

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const color = formData.get('color') as string;
        const logo = formData.get('logo') as File | null;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        let logoUrl = null;

        // Handle logo upload if exists
        try {
            if (logo && logo.size > 0) {
                const fileExt = logo.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                // Use admin client if available, otherwise fall back to user client
                const uploader = supabaseAdmin || supabase;

                const { error: uploadError } = await uploader.storage
                    .from('workspace-images')
                    .upload(fileName, logo, {
                        contentType: logo.type,
                        upsert: true
                    });

                if (uploadError) {
                    console.error('Error uploading logo:', uploadError);
                    // Don't fail the entire request, just log and proceed without logo
                    // or return a specific error if logo is critical (it's usually optional)
                    console.warn('Continuing space creation without logo due to upload failure.');
                } else {
                    const { data: { publicUrl } } = uploader.storage
                        .from('workspace-images')
                        .getPublicUrl(fileName);

                    logoUrl = publicUrl;
                }
            }
        } catch (uploadErr) {
            console.error('Unexpected error during logo upload:', uploadErr);
            // Proceed without logo
        }

        // Use admin client if available to bypass RLS, otherwise fall back to user client
        const dbClient = supabaseAdmin || supabase;

        // Insert space into database
        const { data: space, error: dbError } = await dbClient
            .from('spaces')
            .insert({
                name,
                description: description || null,
                color: color || '#f56f10', // Default orange
                logo_url: logoUrl,
                created_by: user.id,
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                {
                    error: 'Failed to create space',
                    details: dbError.message,
                    code: dbError.code,
                    hint: dbError.hint
                },
                { status: 500 }
            );
        }

        // Add creator as admin member
        const { error: memberError } = await dbClient
            .from('space_members')
            .insert({
                space_id: space.id,
                user_id: user.id,
                role: 'admin'
            });

        if (memberError) {
            console.error('Error adding creator as member:', memberError);
            // We don't fail the request here as the space was created, 
            // but log the error. The user is still the owner.
        }

        return NextResponse.json(space);

    } catch (err: any) {
        console.error('Server error:', err);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: err.message
            },
            { status: 500 }
        );
    }
}
