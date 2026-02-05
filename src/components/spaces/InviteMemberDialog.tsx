"use client";

import { useState } from "react";
import { UserPlus, Copy, Check } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface InviteMemberDialogProps {
    spaceId: string;
    spaceName: string;
}

export function InviteMemberDialog({ spaceId, spaceName }: InviteMemberDialogProps) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "member" | "guest">("member");
    const [isLoading, setIsLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");

    const handleSendInvite = async () => {
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch(`/api/spaces/${spaceId}/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erro ao enviar convite");
            }

            // Generate invite link
            const link = `${window.location.origin}/accept-invitation?token=${data.token}`;
            setInviteLink(link);
            setEmail("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setInviteLink(null);
        setEmail("");
        setError("");
        setCopied(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Convidar Membros
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Convidar para {spaceName}</DialogTitle>
                    <DialogDescription>
                        Envie um convite por email para adicionar novos membros ao espaço.
                    </DialogDescription>
                </DialogHeader>

                {!inviteLink ? (
                    <div className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="email@exemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Role Select */}
                        <div className="space-y-2">
                            <Label htmlFor="role">Função</Label>
                            <Select value={role} onValueChange={(v) => setRole(v as any)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="guest">Convidado (visualizar)</SelectItem>
                                    <SelectItem value="member">Membro (editar)</SelectItem>
                                    <SelectItem value="admin">Admin (gerenciar)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={handleSendInvite}
                            disabled={!email || isLoading}
                            className="w-full bg-zark hover:bg-zark-dark"
                        >
                            {isLoading ? "Criando convite..." : "Criar Convite"}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-zark/10 border border-zark/20">
                            <p className="text-sm text-muted-foreground mb-2">
                                Link de convite criado! Compartilhe com <strong>{email}</strong>:
                            </p>
                            <div className="flex gap-2">
                                <Input value={inviteLink} readOnly className="text-xs" />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={handleCopyLink}
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <Button onClick={handleClose} variant="outline" className="w-full">
                            Fechar
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
