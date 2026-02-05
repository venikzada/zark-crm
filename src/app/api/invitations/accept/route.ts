import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ error: "Token não fornecido" }, { status: 400 });
        }

        // Get current user
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        // Find invitation by token
        const { data: invitation, error: inviteError } = await supabase
            .from("space_invitations")
            .select(
                `
                *,
                space:spaces(id, name)
            `
            )
            .eq("token", token)
            .is("accepted_at", null)
            .single();

        if (inviteError || !invitation) {
            return NextResponse.json(
                { error: "Convite inválido ou já utilizado" },
                { status: 404 }
            );
        }

        // Check if invitation has expired
        const expiresAt = new Date(invitation.expires_at);
        if (expiresAt < new Date()) {
            return NextResponse.json(
                { error: "Convite expirado" },
                { status: 410 }
            );
        }

        // Check if user's email matches the invitation
        if (user.email !== invitation.email) {
            return NextResponse.json(
                {
                    error: `Este convite foi enviado para ${invitation.email}. Faça login com esse email.`,
                },
                { status: 403 }
            );
        }

        // Check if user is already a member
        const { data: existingMember } = await supabase
            .from("space_members")
            .select("id")
            .eq("space_id", invitation.space_id)
            .eq("user_id", user.id)
            .single();

        if (existingMember) {
            // Already a member, just mark invitation as accepted
            await supabase
                .from("space_invitations")
                .update({ accepted_at: new Date().toISOString() })
                .eq("id", invitation.id);

            return NextResponse.json({
                success: true,
                spaceId: invitation.space_id,
                message: "Você já é membro deste espaço",
            });
        }

        // Add user to space
        const { error: memberError } = await supabase.from("space_members").insert({
            space_id: invitation.space_id,
            user_id: user.id,
            role: invitation.role,
        });

        if (memberError) {
            console.error("Error adding member:", memberError);
            return NextResponse.json(
                { error: "Erro ao adicionar membro ao espaço" },
                { status: 500 }
            );
        }

        // Mark invitation as accepted
        await supabase
            .from("space_invitations")
            .update({ accepted_at: new Date().toISOString() })
            .eq("id", invitation.id);

        return NextResponse.json({
            success: true,
            spaceId: invitation.space_id,
            spaceName: invitation.space?.name,
        });
    } catch (error) {
        console.error("Error accepting invitation:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
