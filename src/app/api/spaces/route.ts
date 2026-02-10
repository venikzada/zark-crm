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
            // Warn but do not fail - we will rely on RLS for DB operations
            console.warn("Missing SUPABASE_SERVICE_ROLE_KEY. Logo uploads may fail, but space creation should work via RLS.");
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
            if (logo && logo.size > 0 && supabaseAdmin) {
                const fileExt = logo.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabaseAdmin.storage
                    .from('workspace-images')
                    .upload(fileName, logo, {
                        contentType: logo.type,
                        upsert: true
                    });

                if (uploadError) {
                    console.error('Error uploading logo:', uploadError);
                    console.warn('Continuing space creation without logo due to upload failure.');
                } else {
                    const { data: { publicUrl } } = supabaseAdmin.storage
                        .from('workspace-images')
                        .getPublicUrl(fileName);

                    logoUrl = publicUrl;
                }
            }
        } catch (uploadErr) {
            console.error('Unexpected error during logo upload:', uploadErr);
            // Proceed without logo
        }

        // Use standard client (user context) - relies on RLS policy "Users can create spaces"
        const { data: space, error: dbError } = await supabase
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
        const { error: memberError } = await supabase
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
