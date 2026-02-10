"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/profile/reset-password`,
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            setIsSubmitted(true);
            toast.success("Email de recuperação enviado!");
        } catch (err) {
            toast.error("Ocorreu um erro. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <Card className="border-border/50 bg-card/50 backdrop-blur max-w-md w-full mx-auto">
                <CardHeader>
                    <CardTitle>Verifique seu email</CardTitle>
                    <CardDescription>
                        Enviamos um link de recuperação para <strong>{email}</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        Clique no link enviado para redefinir sua senha. Se não encontrar, verifique a caixa de spam.
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/login">Voltar para Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur max-w-md w-full mx-auto">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Recuperar senha</CardTitle>
                <CardDescription>
                    Digite seu email para receber um link de redefinição
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleReset} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-zark hover:bg-zark-dark"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            "Enviar Link"
                        )}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Link
                    href="/login"
                    className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Login
                </Link>
            </CardFooter>
        </Card>
    );
}
