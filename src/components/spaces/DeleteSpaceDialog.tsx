"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteSpaceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    spaceId: string;
    spaceName: string;
}

export function DeleteSpaceDialog({ open, onOpenChange, spaceId, spaceName }: DeleteSpaceDialogProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/spaces/${spaceId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Falha ao excluir espaço");
            }

            toast.success("Espaço excluído com sucesso");
            onOpenChange(false);
            router.push("/dashboard"); // Redirect to dashboard
            router.refresh(); // Refresh list

        } catch (error) {
            console.error("Error deleting space:", error);
            toast.error(error instanceof Error ? error.message : "Erro ao excluir espaço");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-[#09090b] border-[#1f1f23]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Excluir Espaço
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Tem certeza que deseja excluir o espaço <strong className="text-white">{spaceName}</strong>?
                        <br /><br />
                        Essa ação é irreversível e excluirá todos os dados associados a este espaço.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                        disabled={isDeleting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Excluir Espaço
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
