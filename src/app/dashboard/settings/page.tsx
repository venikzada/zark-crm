"use client";

import { useState } from "react";
import Image from "next/image";
import {
    User,
    Bell,
    Palette,
    Shield,
    Link2,
    Settings,
    Calendar,
    MessageSquare,
    Check,
    X,
    Plus,
    ExternalLink,
    Smartphone,
    RefreshCw,
    Zap,
    Clock,
    Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Integration card component
function IntegrationCard({
    icon: Icon,
    iconBg,
    title,
    description,
    connected,
    connectedInfo,
    onConnect,
    onDisconnect,
    children,
}: {
    icon: React.ElementType;
    iconBg: string;
    title: string;
    description: string;
    connected: boolean;
    connectedInfo?: string;
    onConnect: () => void;
    onDisconnect: () => void;
    children?: React.ReactNode;
}) {
    return (
        <Card className={cn(
            "border-border/50 transition-all duration-300",
            connected && "border-zark/30 bg-zark/5"
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-xl", iconBg)}>
                            <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                {title}
                                {connected && (
                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                        <Check className="h-3 w-3 mr-1" />
                                        Conectado
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="mt-0.5">{description}</CardDescription>
                        </div>
                    </div>
                    {connected ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDisconnect}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Desconectar
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={onConnect}
                            className="bg-zark hover:bg-zark-dark"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Conectar
                        </Button>
                    )}
                </div>
            </CardHeader>
            {(connected || children) && (
                <CardContent className="pt-0">
                    {connected && connectedInfo && (
                        <p className="text-sm text-muted-foreground mb-3">
                            {connectedInfo}
                        </p>
                    )}
                    {children}
                </CardContent>
            )}
        </Card>
    );
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("profile");

    // Profile state
    const [profile, setProfile] = useState({
        fullName: "Renan Kennedy",
        email: "renan@zark.com.br",
        phone: "+55 11 99999-9999",
        timezone: "America/Sao_Paulo",
    });

    // Integration states
    const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
    const [whatsappConnected, setWhatsappConnected] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState("");

    // Notification preferences
    const [notifications, setNotifications] = useState({
        dailyDigest: true,
        taskReminders: true,
        dueSoonAlerts: true,
        overdueAlerts: true,
        commentMentions: true,
        digestTime: "08:00",
    });

    // Calendar sync preferences
    const [calendarSync, setCalendarSync] = useState({
        syncTasks: true,
        syncDueDates: true,
        createEvents: true,
        selectedCalendar: "",
    });

    // WhatsApp preferences
    const [whatsappPrefs, setWhatsappPrefs] = useState({
        dailyDigest: true,
        taskReminders: true,
        overdueAlerts: true,
        digestTime: "08:00",
    });

    const handleGoogleCalendarConnect = () => {
        // In production, this would redirect to Google OAuth
        // For demo, we'll simulate the connection
        window.open(
            "https://accounts.google.com/o/oauth2/v2/auth?" +
            "client_id=YOUR_CLIENT_ID&" +
            "redirect_uri=" + encodeURIComponent(window.location.origin + "/api/auth/google/callback") + "&" +
            "response_type=code&" +
            "scope=https://www.googleapis.com/auth/calendar.events&" +
            "access_type=offline",
            "_blank",
            "width=500,height=600"
        );

        // Simulate connection for demo
        setTimeout(() => {
            setGoogleCalendarConnected(true);
        }, 1000);
    };

    const handleWhatsappConnect = () => {
        if (!whatsappNumber) return;
        // In production, this would send a verification code via WhatsApp API
        // For demo, we'll simulate the connection
        setWhatsappConnected(true);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Configurações</h1>
                <p className="text-muted-foreground">Gerencie seu perfil e preferências</p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        Perfil
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="gap-2">
                        <Link2 className="h-4 w-4" />
                        Integrações
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Notificações
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="gap-2">
                        <Palette className="h-4 w-4" />
                        Aparência
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle>Informações Pessoais</CardTitle>
                            <CardDescription>Atualize suas informações de perfil</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src="/avatars/user.png" />
                                    <AvatarFallback className="bg-zark/20 text-zark text-xl">
                                        RK
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <Button variant="outline" size="sm">
                                        Alterar foto
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        JPG, PNG ou GIF. Máximo 2MB.
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            {/* Form Fields */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Nome completo</Label>
                                    <Input
                                        id="fullName"
                                        value={profile.fullName}
                                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                        className="bg-muted/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        className="bg-muted/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        className="bg-muted/30"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Fuso horário</Label>
                                    <Select
                                        value={profile.timezone}
                                        onValueChange={(value) => setProfile({ ...profile, timezone: value })}
                                    >
                                        <SelectTrigger className="bg-muted/30">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                                            <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                                            <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                                            <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button className="bg-zark hover:bg-zark-dark">
                                    Salvar alterações
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Segurança
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Alterar senha</p>
                                    <p className="text-sm text-muted-foreground">Última alteração há 30 dias</p>
                                </div>
                                <Button variant="outline">Alterar</Button>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Autenticação em dois fatores</p>
                                    <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Integrations Tab */}
                <TabsContent value="integrations" className="space-y-6">
                    {/* Google Calendar */}
                    <IntegrationCard
                        icon={Calendar}
                        iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
                        title="Google Calendar"
                        description="Sincronize tarefas com seu calendário do Google"
                        connected={googleCalendarConnected}
                        connectedInfo="Conectado como renan@gmail.com"
                        onConnect={handleGoogleCalendarConnect}
                        onDisconnect={() => setGoogleCalendarConnected(false)}
                    >
                        {googleCalendarConnected && (
                            <div className="space-y-4 pt-2">
                                <Separator />

                                {/* Calendar Selection */}
                                <div className="space-y-2">
                                    <Label>Calendário para sincronizar</Label>
                                    <Select
                                        value={calendarSync.selectedCalendar}
                                        onValueChange={(value) => setCalendarSync({ ...calendarSync, selectedCalendar: value })}
                                    >
                                        <SelectTrigger className="bg-muted/30">
                                            <SelectValue placeholder="Selecione um calendário" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="primary">Calendário principal</SelectItem>
                                            <SelectItem value="work">Trabalho</SelectItem>
                                            <SelectItem value="personal">Pessoal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Sync Options */}
                                <div className="space-y-3">
                                    <Label>Opções de sincronização</Label>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">Sincronizar tarefas</p>
                                            <p className="text-xs text-muted-foreground">Criar eventos para novas tarefas</p>
                                        </div>
                                        <Switch
                                            checked={calendarSync.syncTasks}
                                            onCheckedChange={(checked) => setCalendarSync({ ...calendarSync, syncTasks: checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">Sincronizar prazos</p>
                                            <p className="text-xs text-muted-foreground">Adicionar lembretes para datas de entrega</p>
                                        </div>
                                        <Switch
                                            checked={calendarSync.syncDueDates}
                                            onCheckedChange={(checked) => setCalendarSync({ ...calendarSync, syncDueDates: checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">Criar eventos automaticamente</p>
                                            <p className="text-xs text-muted-foreground">Quando uma tarefa tiver data e horário</p>
                                        </div>
                                        <Switch
                                            checked={calendarSync.createEvents}
                                            onCheckedChange={(checked) => setCalendarSync({ ...calendarSync, createEvents: checked })}
                                        />
                                    </div>
                                </div>

                                <Button variant="outline" size="sm" className="gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Sincronizar agora
                                </Button>
                            </div>
                        )}
                    </IntegrationCard>

                    {/* WhatsApp */}
                    <IntegrationCard
                        icon={MessageSquare}
                        iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
                        title="WhatsApp"
                        description="Receba tarefas do dia e lembretes no WhatsApp"
                        connected={whatsappConnected}
                        connectedInfo={`Conectado ao número ${whatsappNumber}`}
                        onConnect={() => { }}
                        onDisconnect={() => setWhatsappConnected(false)}
                    >
                        {!whatsappConnected ? (
                            <div className="space-y-4 pt-2">
                                <Separator />
                                <div className="space-y-2">
                                    <Label>Número do WhatsApp</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="+55 11 99999-9999"
                                            value={whatsappNumber}
                                            onChange={(e) => setWhatsappNumber(e.target.value)}
                                            className="bg-muted/30 flex-1"
                                        />
                                        <Button
                                            onClick={handleWhatsappConnect}
                                            disabled={!whatsappNumber}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            <Smartphone className="h-4 w-4 mr-2" />
                                            Verificar
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Enviaremos um código de verificação para este número
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 pt-2">
                                <Separator />

                                {/* WhatsApp Notification Options */}
                                <div className="space-y-3">
                                    <Label>Notificações do WhatsApp</Label>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">Resumo diário</p>
                                            <p className="text-xs text-muted-foreground">Receba suas tarefas do dia todas as manhãs</p>
                                        </div>
                                        <Switch
                                            checked={whatsappPrefs.dailyDigest}
                                            onCheckedChange={(checked) => setWhatsappPrefs({ ...whatsappPrefs, dailyDigest: checked })}
                                        />
                                    </div>

                                    {whatsappPrefs.dailyDigest && (
                                        <div className="ml-4 flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <Select
                                                value={whatsappPrefs.digestTime}
                                                onValueChange={(value) => setWhatsappPrefs({ ...whatsappPrefs, digestTime: value })}
                                            >
                                                <SelectTrigger className="w-32 bg-muted/30">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="07:00">07:00</SelectItem>
                                                    <SelectItem value="08:00">08:00</SelectItem>
                                                    <SelectItem value="09:00">09:00</SelectItem>
                                                    <SelectItem value="10:00">10:00</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">Lembretes de tarefas</p>
                                            <p className="text-xs text-muted-foreground">30 minutos antes do prazo</p>
                                        </div>
                                        <Switch
                                            checked={whatsappPrefs.taskReminders}
                                            onCheckedChange={(checked) => setWhatsappPrefs({ ...whatsappPrefs, taskReminders: checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">Alertas de atraso</p>
                                            <p className="text-xs text-muted-foreground">Quando uma tarefa passar do prazo</p>
                                        </div>
                                        <Switch
                                            checked={whatsappPrefs.overdueAlerts}
                                            onCheckedChange={(checked) => setWhatsappPrefs({ ...whatsappPrefs, overdueAlerts: checked })}
                                        />
                                    </div>
                                </div>

                                {/* Preview Message */}
                                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">Exemplo de mensagem:</p>
                                    <div className="bg-card rounded-lg p-3 text-sm space-y-2">
                                        <p className="font-medium">📋 Suas tarefas para hoje:</p>
                                        <p>1. ⚡ <strong>Table B24</strong> - Urgente</p>
                                        <p>2. 🔶 <strong>Coworking V223</strong> - Média</p>
                                        <p>3. ✅ <strong>VIP zone</strong> - Em progresso</p>
                                        <p className="text-muted-foreground text-xs mt-2">
                                            Responda "Ver" para abrir no app
                                        </p>
                                    </div>
                                </div>

                                <Button variant="outline" size="sm" className="gap-2">
                                    Enviar mensagem de teste
                                </Button>
                            </div>
                        )}
                    </IntegrationCard>

                    {/* Other Integrations */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card className="border-border/50 hover:border-zark/30 transition-colors cursor-pointer">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-slate-500/10">
                                        <Zap className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Slack</p>
                                        <p className="text-sm text-muted-foreground">Em breve</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 hover:border-zark/30 transition-colors cursor-pointer">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-slate-500/10">
                                        <Globe className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Zapier</p>
                                        <p className="text-sm text-muted-foreground">Em breve</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle>Preferências de Notificação</CardTitle>
                            <CardDescription>Configure como deseja receber notificações</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Resumo diário por email</p>
                                    <p className="text-sm text-muted-foreground">Receba um resumo das tarefas do dia</p>
                                </div>
                                <Switch
                                    checked={notifications.dailyDigest}
                                    onCheckedChange={(checked) => setNotifications({ ...notifications, dailyDigest: checked })}
                                />
                            </div>

                            {notifications.dailyDigest && (
                                <div className="ml-4 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <Select
                                        value={notifications.digestTime}
                                        onValueChange={(value) => setNotifications({ ...notifications, digestTime: value })}
                                    >
                                        <SelectTrigger className="w-32 bg-muted/30">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="07:00">07:00</SelectItem>
                                            <SelectItem value="08:00">08:00</SelectItem>
                                            <SelectItem value="09:00">09:00</SelectItem>
                                            <SelectItem value="10:00">10:00</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Lembretes de tarefas</p>
                                    <p className="text-sm text-muted-foreground">Notificações antes do prazo</p>
                                </div>
                                <Switch
                                    checked={notifications.taskReminders}
                                    onCheckedChange={(checked) => setNotifications({ ...notifications, taskReminders: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Alertas de prazo próximo</p>
                                    <p className="text-sm text-muted-foreground">24 horas antes da data de entrega</p>
                                </div>
                                <Switch
                                    checked={notifications.dueSoonAlerts}
                                    onCheckedChange={(checked) => setNotifications({ ...notifications, dueSoonAlerts: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Alertas de atraso</p>
                                    <p className="text-sm text-muted-foreground">Quando uma tarefa passar do prazo</p>
                                </div>
                                <Switch
                                    checked={notifications.overdueAlerts}
                                    onCheckedChange={(checked) => setNotifications({ ...notifications, overdueAlerts: checked })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Menções em comentários</p>
                                    <p className="text-sm text-muted-foreground">Quando alguém te mencionar</p>
                                </div>
                                <Switch
                                    checked={notifications.commentMentions}
                                    onCheckedChange={(checked) => setNotifications({ ...notifications, commentMentions: checked })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-6">
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle>Aparência</CardTitle>
                            <CardDescription>Personalize a interface do ZARK</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Tema</Label>
                                <div className="grid grid-cols-3 gap-4">
                                    <button className="p-4 rounded-lg border-2 border-zark bg-muted/30 text-center">
                                        <div className="h-10 w-full rounded bg-zinc-900 mb-2" />
                                        <span className="text-sm font-medium">Dark</span>
                                    </button>
                                    <button className="p-4 rounded-lg border border-border/50 text-center hover:border-zark/50 transition-colors">
                                        <div className="h-10 w-full rounded bg-white mb-2" />
                                        <span className="text-sm font-medium">Light</span>
                                    </button>
                                    <button className="p-4 rounded-lg border border-border/50 text-center hover:border-zark/50 transition-colors">
                                        <div className="h-10 w-full rounded bg-gradient-to-r from-zinc-900 to-white mb-2" />
                                        <span className="text-sm font-medium">Sistema</span>
                                    </button>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label>Cor de destaque</Label>
                                <div className="flex gap-3">
                                    {[
                                        "#f56f10", // ZARK Orange
                                        "#22c55e", // Green
                                        "#3b82f6", // Blue
                                        "#ef4444", // Red
                                        "#eab308", // Yellow
                                    ].map((color) => (
                                        <button
                                            key={color}
                                            className={cn(
                                                "w-8 h-8 rounded-full ring-offset-2 ring-offset-background transition-all",
                                                color === "#f56f10" && "ring-2 ring-white"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
