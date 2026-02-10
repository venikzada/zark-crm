import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// DELETE: Delete a space
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ spaceId: string }> }
) {
    try {
        const params = await props.params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const spaceId = params.spaceId;

        if (!spaceId) {
            return NextResponse.json({ error: 'Space ID is required' }, { status: 400 });
        }

        // Check if user is owner of the space
        const { data: space, error: fetchError } = await supabase
            .from('spaces')
            .select('id, created_by, logo_url')
            .eq('id', spaceId)
            .single();

        if (fetchError || !space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        if (space.created_by !== user.id) {
            return NextResponse.json({ error: 'Unauthorized: Only the owner can delete the space' }, { status: 403 });
        }

        // Delete logo from storage if exists
        if (space.logo_url) {
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (serviceRoleKey) {
                const supabaseAdmin = createSupabaseClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    serviceRoleKey,
                    {
                        auth: {
                            autoRefreshToken: false,
                            persistSession: false
                        }
                    }
                );

                // Extract path from URL (naive implementation, assumes standard supabase storage url structure)
                // URL: .../storage/v1/object/public/workspace-images/USER_ID/FILENAME
                try {
                    const url = new URL(space.logo_url);
                    const pathParts = url.pathname.split('/workspace-images/');
                    if (pathParts.length > 1) {
                        const storagePath = pathParts[1];
                        await supabaseAdmin.storage
                            .from('workspace-images')
                            .remove([storagePath]);
                    }
                } catch (e) {
                    console.error("Error parsing/deleting logo:", e);
                }
            }
        }

        // Delete space (Cascade should handle members/lists/cards if configured, otherwise RLS might block if not careful)
        // Ideally, we delete the space and let Postgres CASCADE do the rest.
        const { error: deleteError } = await supabase
            .from('spaces')
            .delete()
            .eq('id', spaceId);

        if (deleteError) {
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH: Update a space
export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ spaceId: string }> }
) {
    try {
        const params = await props.params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const spaceId = params.spaceId;
        const formData = await request.formData();

        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const color = formData.get('color') as string;
        const logo = formData.get('logo') as File | null;
        const removeLogo = formData.get('removeLogo') === 'true';

        // Check ownership
        const { data: space, error: fetchError } = await supabase
            .from('spaces')
            .select('id, created_by, logo_url')
            .eq('id', spaceId)
            .single();

        if (fetchError || !space) {
            return NextResponse.json({ error: 'Space not found' }, { status: 404 });
        }

        if (space.created_by !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const updates: any = {};
        if (name) updates.name = name;
        if (description !== null) updates.description = description;
        if (color) updates.color = color;

        // Handle Logo Upload/Removal
        if (removeLogo && space.logo_url) {
            updates.logo_url = null;
            // TODO: Delete old logo from storage (optional for now)
        } else if (logo && logo.size > 0) {
            // Admin client for upload
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (serviceRoleKey) {
                const supabaseAdmin = createSupabaseClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    serviceRoleKey,
                    {
                        auth: {
                            autoRefreshToken: false,
                            persistSession: false
                        }
                    }
                );

                const fileExt = logo.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabaseAdmin.storage
                    .from('workspace-images')
                    .upload(fileName, logo, {
                        contentType: logo.type,
                        upsert: true
                    });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabaseAdmin.storage
                        .from('workspace-images')
                        .getPublicUrl(fileName);

                    updates.logo_url = publicUrl;
                }
            }
        }

        const { data: updatedSpace, error: updateError } = await supabase
            .from('spaces')
            .update(updates)
            .eq('id', spaceId)
            .select()
            .maybeSingle();

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        if (!updatedSpace) {
            // accessible via SELECT but not UPDATE -> RLS or concurrent delete
            return NextResponse.json({ error: 'Update failed. Check permissions.' }, { status: 403 });
        }

        return NextResponse.json(updatedSpace);

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
