"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function AcceptInvitationPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md p-8 text-center space-y-6">
                <Suspense fallback={
                    <>
                        <Loader2 className="h-12 w-12 mx-auto text-zark animate-spin" />
                        <h1 className="text-2xl font-bold">Carregando...</h1>
                    </>
                }>
                    <AcceptInvitationForm />
                </Suspense>
            </Card>
        </div>
    );
}

function AcceptInvitationForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const [spaceId, setSpaceId] = useState<string | null>(null);

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            setStatus("error");
            setMessage("Token de convite não encontrado");
            return;
        }

        checkAuthAndAccept(token);
    }, [searchParams]);

    const checkAuthAndAccept = async (token: string) => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            // Redirect to login with return URL
            const returnUrl = `/accept-invitation?token=${token}`;
            router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
            return;
        }

        // User is authenticated, accept invitation
        await acceptInvitation(token);
    };

    const acceptInvitation = async (token: string) => {
        try {
            const response = await fetch("/api/invitations/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (!response.ok) {
                setStatus("error");
                setMessage(data.error || "Erro ao aceitar convite");
                return;
            }

            setStatus("success");
            setMessage(
                data.message ||
                `Bem-vindo! Você agora é membro do espaço ${data.spaceName || ""}.`
            );
            setSpaceId(data.spaceId);

            // Redirect to space after 2 seconds
            setTimeout(() => {
                router.push(`/dashboard/spaces/${data.spaceId}`);
            }, 2000);
        } catch (error: any) {
            setStatus("error");
            setMessage("Erro ao processar convite");
        }
    };

    if (status === "loading") {
        return (
            <>
                <Loader2 className="h-12 w-12 mx-auto text-zark animate-spin" />
                <h1 className="text-2xl font-bold">Processando convite...</h1>
                <p className="text-muted-foreground">
                    Aguarde enquanto validamos seu convite.
                </p>
            </>
        );
    }

    if (status === "success") {
        return (
            <>
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <h1 className="text-2xl font-bold text-green-500">Convite Aceito!</h1>
                <p className="text-muted-foreground">{message}</p>
                <p className="text-sm text-muted-foreground">
                    Redirecionando para o espaço...
                </p>
            </>
        );
    }

    if (status === "error") {
        return (
            <>
                <XCircle className="h-12 w-12 mx-auto text-destructive" />
                <h1 className="text-2xl font-bold text-destructive">Erro</h1>
                <p className="text-muted-foreground">{message}</p>
                <Button onClick={() => router.push("/dashboard")} className="mt-4">
                    Voltar ao Dashboard
                </Button>
            </>
        );
    }

    return null;
}
