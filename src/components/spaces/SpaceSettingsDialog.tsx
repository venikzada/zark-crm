"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Preset colors (same as CreateSpaceDialog)
const PRESET_COLORS = [
    "#f56f10", // Zark Orange
    "#ef4444", // Red
    "#22c55e", // Green
    "#3b82f6", // Blue
    "#a855f7", // Purple
    "#ec4899", // Pink
    "#eab308", // Yellow
    "#64748b", // Slate
];

interface SpaceSettingsDialogProps {
    space: {
        id: string;
        name: string;
        color: string;
        logo_url?: string;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SpaceSettingsDialog({ space, open, onOpenChange }: SpaceSettingsDialogProps) {
    const router = useRouter();
    const [name, setName] = useState(space.name);
    const [color, setColor] = useState(space.color || PRESET_COLORS[0]);
    const [logoPreview, setLogoPreview] = useState<string | null>(space.logo_url || null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form when opening
    useEffect(() => {
        if (open) {
            setName(space.name);
            setColor(space.color);
            setLogoPreview(space.logo_url || null);
            setLogoFile(null);
        }
    }, [open, space]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async () => {
        if (!name) return toast.error("Nome do espaço é obrigatório");

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("color", color);
            if (logoFile) {
                formData.append("logo", logoFile);
            }
            // If user removed logo (implemented via X button logic if needed)
            // For now, if logoPreview is null but space had url, imply removal? 
            // Simplified: only update if file present or just text fields.

            const response = await fetch(`/api/spaces/${space.id}`, {
                method: "PATCH",
                body: formData,
            });

            if (!response.ok) throw new Error("Falha ao atualizar espaço");

            toast.success("Espaço atualizado!");
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            toast.error("Erro ao atualizar espaço");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/spaces/${space.id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Falha ao excluir espaço");

            toast.success("Espaço excluído");
            onOpenChange(false);
            router.push("/dashboard");
            router.refresh();
        } catch (error) {
            toast.error("Erro ao excluir espaço");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-[#09090b] border-[#1f1f23] p-0 overflow-hidden">
                <div className="flex bg-[#09090b]">
                    {/* Sidebar Tabs */}
                    <div className="w-[200px] border-r border-[#1f1f23] bg-[#09090b] p-2 flex flex-col gap-1">
                        <DialogTitle className="text-sm font-medium text-zinc-400 px-3 py-2">
                            Configurações do Espaço
                        </DialogTitle>
                        <Button variant="ghost" className="w-full justify-start text-white bg-zinc-800/50">
                            Geral
                        </Button>
                        <div className="flex-1" />
                        <div className="px-3 pb-3">
                            <span className="text-xs text-zinc-600 block">ID: {space.id.slice(0, 8)}...</span>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 space-y-6">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Editar Espaço</DialogTitle>
                            <DialogDescription>Edite as configurações do seu espaço</DialogDescription>
                        </DialogHeader>

                        {/* Logo & Name */}
                        <div className="flex gap-4 items-start">
                            <div
                                className={cn(
                                    "relative flex items-center justify-center w-20 h-20 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 cursor-pointer hover:border-zark/50 overflow-hidden shrink-0",
                                )}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {logoPreview ? (
                                    <Image src={logoPreview} alt="Logo" fill className="object-cover" />
                                ) : (
                                    <span style={{ color }} className="text-2xl font-bold">
                                        {name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Upload className="w-5 h-5 text-white" />
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>

                            <div className="flex-1 space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-zinc-400 text-xs">Nome do Espaço</Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-zinc-900 border-zinc-700 text-white h-9"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-zinc-400 text-xs">Cor</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {PRESET_COLORS.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setColor(c)}
                                                className={cn(
                                                    "w-5 h-5 rounded-full border transition-all",
                                                    color === c ? "border-white scale-110" : "border-transparent"
                                                )}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="pt-6 border-t border-zinc-800">
                            {!isDeleting ? (
                                <Button
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-400 hover:bg-red-950/20 w-full justify-start gap-2"
                                    onClick={() => setIsDeleting(true)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Excluir Espaço
                                </Button>
                            ) : (
                                <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-red-500 font-medium">
                                        <AlertTriangle className="w-5 h-5" />
                                        Excluir Permanentemente?
                                    </div>
                                    <p className="text-sm text-zinc-400">
                                        Esta ação não pode ser desfeita. Isso excluirá <strong>"{space.name}"</strong> e todos os dados.
                                    </p>
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="ghost" size="sm" onClick={() => setIsDeleting(false)} className="text-zinc-400 hover:text-white">
                                            Cancelar
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                                            Confirmar Exclusão
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="flex justify-end pt-4 gap-2">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white">Cancelar</Button>
                            <Button onClick={handleUpdate} disabled={isSubmitting} className="bg-zark hover:bg-zark/90 text-white">
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Salvar Alterações
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
