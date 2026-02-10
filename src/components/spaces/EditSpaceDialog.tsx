"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Preset colors for spaces
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

interface EditSpaceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    space: {
        id: string;
        name: string;
        color?: string;
        logo_url?: string | null;
    };
}

export function EditSpaceDialog({ open, onOpenChange, space }: EditSpaceDialogProps) {
    const router = useRouter();
    const [name, setName] = useState(space.name);
    const [color, setColor] = useState(space.color || PRESET_COLORS[0]);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(space.logo_url || null);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form when space changes or dialog opens
    useEffect(() => {
        if (open) {
            setName(space.name);
            setColor(space.color || PRESET_COLORS[0]);
            setLogoPreview(space.logo_url || null);
            setLogoFile(null);
            setRemoveLogo(false);
        }
    }, [open, space]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
                setRemoveLogo(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        // Validate type image
        if (file && file.type.startsWith("image/")) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
                setRemoveLogo(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLogoFile(null);
        setLogoPreview(null);
        setRemoveLogo(true);
    };

    const handleUpdate = async () => {
        if (!name) {
            toast.error("Nome do espaço é obrigatório");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("color", color);

            if (removeLogo) {
                formData.append("removeLogo", "true");
            } else if (logoFile) {
                formData.append("logo", logoFile);
            }

            const response = await fetch(`/api/spaces/${space.id}`, {
                method: "PATCH",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error || "Falha ao atualizar espaço";
                throw new Error(errorMessage);
            }

            toast.success("Espaço atualizado com sucesso!");
            onOpenChange(false);
            router.refresh();

        } catch (error) {
            console.error("Error updating space:", error);
            toast.error(error instanceof Error ? error.message : "Erro ao atualizar espaço");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-[#09090b] border-[#1f1f23]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white">Editar Espaço</DialogTitle>
                    <DialogDescription className="sr-only">
                        Edite as informações do seu espaço.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Logo Upload Section */}
                    <div className="flex flex-col gap-3">
                        <Label className="text-zinc-400">Logo do Cliente / Espaço</Label>
                        <div
                            className={cn(
                                "relative flex items-center justify-center w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 transition-colors cursor-pointer hover:border-zark/50 hover:bg-zinc-900",
                                logoPreview && "border-solid border-transparent p-0 overflow-hidden"
                            )}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            {logoPreview ? (
                                <>
                                    <Image
                                        src={logoPreview}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <X className="w-6 h-6 text-white" onClick={handleRemoveLogo} />
                                    </div>
                                </>
                            ) : (
                                <Upload className="h-8 w-8 text-zinc-500" />
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    {/* Name Input */}
                    <div className="grid gap-2">
                        <Label htmlFor="edit-name" className="text-zinc-400">Nome do Espaço</Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-zark/50 focus:ring-zark/20"
                            placeholder="Ex: Marketing, Cliente ABC"
                        />
                    </div>

                    {/* Color Picker */}
                    <div className="grid gap-2">
                        <Label className="text-zinc-400">Cor de Identificação</Label>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all",
                                        color === c ? "border-white scale-110" : "border-transparent hover:scale-105"
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleUpdate}
                        disabled={!name || isSubmitting}
                        className="bg-zark hover:bg-zark/90 text-white"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
