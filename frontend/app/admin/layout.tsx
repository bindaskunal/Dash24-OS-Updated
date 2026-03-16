"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navItems = [
        { name: "Order Routing", href: "/admin/orders", icon: "📦" },
        { name: "Procurement", href: "/admin/inventory", icon: "📊" },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-4 md:px-10 h-16 md:h-20 flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 md:py-0">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 hover:scale-105 transition hover:shadow-md">
                            <span className="text-xl">⌂</span>
                        </Link>
                        <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight whitespace-nowrap">Katzen OS</h1>
                    </div>

                    <nav className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {navItems.map((item) => {
                            const isActive = pathname?.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-100'
                                            : 'bg-white text-gray-600 border border-gray-100 shadow-sm hover:scale-105 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className={isActive ? 'opacity-100' : 'opacity-70'}>{item.icon}</span>
                                    {item.name}
                                </Link>
                            );
                        })}

                        {/* Future Module Stubs */}
                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-white/50 text-gray-400 border border-gray-100 border-dashed cursor-not-allowed hidden md:flex">
                            <span className="opacity-50">👥</span>
                            CRM
                        </div>
                    </nav>

                    <div className="hidden lg:flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-gray-900 text-white px-4 py-2 rounded-2xl shadow-md cursor-help group">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 group-hover:text-white transition-colors">System Online</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="w-full">
                {children}
            </div>
        </div>
    );
}
