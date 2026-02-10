import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// GET: Fetch space details
export async function GET(
    request: NextRequest,
    { params }: { params: { spaceId: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { data: space, error } = await supabase
            .from('spaces')
            .select('*')
            .eq('id', params.spaceId)
            .single();

        if (error) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        return NextResponse.json(space);
    } catch (err: any) {
        return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
    }
}

// PATCH: Update space details (Name, Color, Logo)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { spaceId: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Verify ownership/membership (RLS handles this but good to fail fast)
        // For now relying on RLS policies for UPDATE

        const formData = await request.formData();
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const color = formData.get('color') as string;
        const logo = formData.get('logo') as File | null;
        const removeLogo = formData.get('removeLogo') === 'true';

        const updateData: any = {};
        if (name) updateData.name = name;
        if (description !== null) updateData.description = description;
        if (color) updateData.color = color;

        // Handle Logo Upload
        if (logo && logo.size > 0) {
            // Admin client for storage
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (serviceRoleKey) {
                const supabaseAdmin = createSupabaseClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    serviceRoleKey,
                    { auth: { autoRefreshToken: false, persistSession: false } }
                );

                const fileExt = logo.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabaseAdmin.storage
                    .from('workspace-images')
                    .upload(fileName, logo, { contentType: logo.type, upsert: true });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabaseAdmin.storage
                        .from('workspace-images')
                        .getPublicUrl(fileName);
                    updateData.logo_url = publicUrl;
                }
            }
        } else if (removeLogo) {
            updateData.logo_url = null;
        }

        const { data: space, error: dbError } = await supabase
            .from('spaces')
            .update(updateData)
            .eq('id', params.spaceId)
            .select()
            .single();

        if (dbError) {
            return NextResponse.json({ error: 'Failed to update space', details: dbError.message }, { status: 500 });
        }

        return NextResponse.json(space);

    } catch (err: any) {
        return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
    }
}

// DELETE: Remove space
export async function DELETE(
    request: NextRequest,
    { params }: { params: { spaceId: string } }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // RLS should handle permission check (only owner/admin can delete)
        const { error } = await supabase
            .from('spaces')
            .delete()
            .eq('id', params.spaceId);

        if (error) {
            return NextResponse.json({ error: 'Failed to delete space', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
    }
}
