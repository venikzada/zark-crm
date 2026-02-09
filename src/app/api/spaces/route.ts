import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
        if (logo && logo.size > 0) {
            const fileExt = logo.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('workspace-images')
                .upload(fileName, logo);

            if (uploadError) {
                console.error('Error uploading logo:', uploadError);
                // Continue without logo if upload fails, or return error? 
                // Let's log and continue for now, or maybe return error.
                // Better to fail if upload was requested but failed.
                return NextResponse.json(
                    { error: 'Failed to upload logo' },
                    { status: 500 }
                );
            }

            const { data: { publicUrl } } = supabase.storage
                .from('workspace-images')
                .getPublicUrl(fileName);

            logoUrl = publicUrl;
        }

        // Insert space into database
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
                { error: 'Failed to create space' },
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

    } catch (err) {
        console.error('Server error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
