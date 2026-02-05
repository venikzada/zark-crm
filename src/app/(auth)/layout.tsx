import Image from "next/image";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen dark">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] items-center justify-center p-12 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zark/20 via-transparent to-transparent" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zark/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-zark/5 rounded-full blur-2xl" />

                <div className="relative z-10 text-center max-w-md">
                    <Image
                        src="/Zark-Laranja.png"
                        alt="ZARK"
                        width={200}
                        height={60}
                        className="mx-auto mb-8 drop-shadow-2xl"
                    />
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Gerencie seus projetos com <span className="gradient-text">foco total</span>
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Plataforma de gestão de projetos e produtividade feita para equipes que querem resultados.
                    </p>
                </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <Image
                            src="/Icon-LB.png"
                            alt="ZARK"
                            width={64}
                            height={64}
                            className="mx-auto mb-4"
                        />
                        <h1 className="text-2xl font-bold gradient-text">ZARK CRM</h1>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
