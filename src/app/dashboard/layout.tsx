"use client";

import { useState } from "react";
import { AppSidebar, Header } from "@/components/layout";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background dark">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <AppSidebar
                    isCollapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
            </div>

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="p-0 border-r border-[#1f1f23] w-[280px] bg-[#09090b]">
                    <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                    <AppSidebar
                        isCollapsed={false}
                        onToggle={() => setMobileOpen(false)} // Close on toggle/click
                    />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header
                    onToggleSidebar={() => setMobileOpen(true)}
                    title="Dashboard"
                />
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
