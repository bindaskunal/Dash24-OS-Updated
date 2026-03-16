import Link from "next/link";
import {
    PackageSearch,
    MapPin,
    AlertTriangle,
    Activity,
    ChevronRight,
    MonitorPlay
} from "lucide-react";

export default function AdminHub() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none -mt-40 -mr-40" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -mb-40 -ml-40" />

            <div className="max-w-[1400px] mx-auto relative z-10">

                {/* Header Title Stream */}
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                        <MonitorPlay className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Katzēn OS</h1>
                        <p className="text-gray-500 font-bold text-sm">Unified Command Center</p>
                    </div>
                </div>
                <hr className="border-gray-200 mb-10" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Tile 1: Order Routing Matrix */}
                    <Link href="/admin/orders" className="group flex flex-col justify-between bg-white rounded-[32px] p-8 min-h-[280px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100/50 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-600">
                            <MapPin className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">Command <br />Routing Matrix</h2>
                            <p className="text-sm font-medium text-gray-500 leading-relaxed">Live geographic node assignment, active delivery states, and telemetry maps.</p>
                        </div>
                        <div className="absolute bottom-6 right-6 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </div>
                    </Link>

                    {/* Tile 2: Inventory & Procurement */}
                    <Link href="/admin/inventory" className="group flex flex-col justify-between bg-white rounded-[32px] p-8 min-h-[280px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden">
                        {/* Sub-badge */}
                        <div className="absolute top-6 right-6 inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            API Seed Live
                        </div>

                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100/50 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all text-emerald-600">
                            <PackageSearch className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight group-hover:text-emerald-600 transition-colors">Global <br />Procurement</h2>
                            <p className="text-sm font-medium text-gray-500 leading-relaxed">Automated PO generation, threshold forecasting, and brand vendor mapping.</p>
                        </div>
                        <div className="absolute bottom-6 right-6 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </div>
                    </Link>

                    {/* Tile 3: Node Health (Future Module Placeholder) */}
                    <div className="group flex flex-col justify-between bg-gray-50/50 rounded-[32px] p-8 min-h-[280px] border border-gray-200/50 relative overflow-hidden cursor-not-allowed">
                        <div className="w-16 h-16 bg-gray-200/50 rounded-2xl flex items-center justify-center mb-6 text-gray-400">
                            <Activity className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-400 mb-2 tracking-tight">System<br />Health Matrix</h2>
                            <p className="text-sm font-medium text-gray-400 leading-relaxed">Weather surges, system diagnostics, and server load balancing.</p>
                        </div>
                        <div className="absolute top-6 right-6 px-3 py-1 bg-gray-200 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            Deployment Pending
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
