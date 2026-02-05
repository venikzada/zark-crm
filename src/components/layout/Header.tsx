"use client";

import { useState } from "react";
import { Menu, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
    onToggleSidebar?: () => void;
    title?: string;
}

export function Header({ onToggleSidebar, title = "Dashboard" }: HeaderProps) {
    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
            {/* Left Section */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidebar}
                    className="lg:hidden text-muted-foreground hover:text-foreground"
                >
                    <Menu className="h-6 w-6" />
                </Button>

                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            </div>

            {/* Center - Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar tarefas, projetos..."
                        className="pl-10 bg-muted/50"
                    />
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
                {/* Mobile Search Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSearchOpen(!searchOpen)}
                >
                    <Search className="h-5 w-5" />
                </Button>
                {/* Quick Add */}
                <ThemeToggle className="mr-2" />
                <Button size="sm" className="gap-2 bg-zark hover:bg-zark-dark">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nova Tarefa</span>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src="/avatars/user.png" alt="User" />
                                <AvatarFallback className="bg-zark text-white font-semibold">
                                    RK
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">Renan Kennedy</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    renan@zark.com.br
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Meu Perfil</DropdownMenuItem>
                        <DropdownMenuItem>Configurações</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
