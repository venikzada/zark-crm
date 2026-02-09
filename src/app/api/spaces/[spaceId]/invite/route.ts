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

        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        // Check if user is admin or owner of the space
        const { data: membership } = await supabase
            .from("space_members")
            .select("role")
            .eq("space_id", spaceId)
            .eq("user_id", user.id)
            .single();

        const { data: space } = await supabase
            .from("spaces")
            .select("created_by")
            .eq("id", spaceId)
            .single();

        const isOwner = space?.created_by === user.id;
        const isAdmin = membership?.role === "admin";

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: "Apenas administradores podem convidar membros" },
                { status: 403 }
            );
        }

        // Self-healing: If user is owner but not a member/admin in the table, add them
        if (isOwner && !membership) {
            console.log("Self-healing: Adding owner to space_members");
            const { error: memberError } = await supabase
                .from("space_members")
                .insert({
                    space_id: spaceId,
                    user_id: user.id,
                    role: "admin",
                });

            if (memberError) {
                console.error("Error auto-fixing membership:", memberError);
                // Continue anyway as they are the owner
            }
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
        console.error("Error in invite route:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
