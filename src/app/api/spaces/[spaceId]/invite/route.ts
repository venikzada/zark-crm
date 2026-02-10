import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ spaceId: string }> }
) {
    try {
        const supabase = await createClient();
        const { spaceId } = await params;
        const { email, role } = await request.json();

        // Get current user
        const {
            data: { user },
        } = await supabase.auth.getUser();

        console.log(`[INVITE_DEBUG] User ID: ${user?.id}`);
        console.log(`[INVITE_DEBUG] Space ID from params: ${spaceId}`);

        if (!user) {
            console.log("[INVITE_DEBUG] No user found.");
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        // Check if user is admin or owner of the space
        const { data: membership } = await supabase
            .from("space_members")
            .select("role")
            .eq("space_id", spaceId)
            .eq("user_id", user.id)
            .single();

        console.log(`[INVITE_DEBUG] Membership found (Standard Client): ${JSON.stringify(membership)}`);

        let isOwner = false;

        // Use service role to check ownership if possible (bypassing RLS)
        // This handles cases where RLS prevents seeing the space
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        console.log(`[INVITE_DEBUG] Has Service Role Key? ${!!serviceRoleKey}`);

        if (serviceRoleKey) {
            console.log("[INVITE_DEBUG] Using Admin Client...");
            const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
            const adminClient = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );

            const { data: spaceAdmin, error: spaceError } = await adminClient
                .from("spaces")
                .select("created_by")
                .eq("id", spaceId)
                .single();

            console.log(`[INVITE_DEBUG] Space (Admin Client):`, spaceAdmin);
            if (spaceError) console.error(`[INVITE_DEBUG] Space Fetch Error (Admin):`, spaceError);

            if (spaceAdmin && spaceAdmin.created_by === user.id) {
                isOwner = true;
                console.log("[INVITE_DEBUG] User is OWNER (Verified via Admin Client)");

                // Self-healing using admin client to bypass RLS
                if (!membership) {
                    console.log("[INVITE_DEBUG] Self-healing (Admin): Adding owner to space_members");
                    const { error: memberError } = await adminClient
                        .from("space_members")
                        .insert({
                            space_id: spaceId,
                            user_id: user.id,
                            role: "admin",
                        });

                    if (memberError) {
                        console.error("[INVITE_DEBUG] Error auto-fixing membership (Admin):", memberError);
                    } else {
                        console.log("[INVITE_DEBUG] Self-healing successful!");
                    }
                }
            }
        } else {
            console.log("[INVITE_DEBUG] Fallback to Standard Client...");
            // Fallback to normal client if no service key
            const { data: space } = await supabase
                .from("spaces")
                .select("created_by")
                .eq("id", spaceId)
                .single();

            console.log(`[INVITE_DEBUG] Space (Standard Client):`, space);

            if (space?.created_by === user.id) {
                isOwner = true;
                // Self-healing: If user is owner but not a member/admin in the table, add them
                // This might fail if RLS prevents insertion, but we try anyway
                if (!membership) {
                    console.log("[INVITE_DEBUG] Self-healing: Adding owner to space_members");
                    const { error: memberError } = await supabase
                        .from("space_members")
                        .insert({
                            space_id: spaceId,
                            user_id: user.id,
                            role: "admin",
                        });

                    if (memberError) {
                        console.error("Error auto-fixing membership:", memberError);
                    }
                }
            }
        }

        const isAdmin = membership?.role === "admin";
        console.log(`[INVITE_DEBUG] Final Check -> isOwner: ${isOwner}, isAdmin: ${isAdmin}`);

        if (!isOwner && !isAdmin) {
            console.log("[INVITE_DEBUG] Access Denied.");
            return NextResponse.json(
                { error: "Apenas administradores podem convidar membros [v2]" },
                { status: 403 }
            );
        }

        // Generate unique token
        const token = randomBytes(32).toString("hex");

        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create invitation
        const { data: invitation, error } = await supabase
            .from("space_invitations")
            .insert({
                space_id: spaceId,
                email,
                role,
                invited_by: user.id,
                token,
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating invitation:", error);
            return NextResponse.json(
                { error: "Erro ao criar convite" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            token: invitation.token,
            invitation,
        });
    } catch (error) {
        console.error("[INVITE_DEBUG] Error in invite route:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
