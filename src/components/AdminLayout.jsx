import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart2, Monitor, Globe, Boxes, Users, TrendingUp, Settings2,
  ShoppingCart, FileText, Package, Truck, Wallet, Megaphone,
} from 'lucide-react'

export default function AdminLayout() {
  const location = useLocation()

  // Sidebar group style: menu dikelompokkan per kategori
  const groups = [
    {
      label: 'Utama',
      items: [
        { label: 'Grafik', path: '/', icon: BarChart2 },
        { label: 'Kasir', path: '/pos', icon: Monitor },
        { label: 'Toko Online', path: '/website', icon: Globe },
      ],
    },
    {
      label: 'Operasional',
      items: [
        { label: 'Inventori', path: '/inventori', icon: Boxes },
        { label: 'Pembelian', path: '/pembelian', icon: ShoppingCart },
        { label: 'Pemasok', path: '/pemasok', icon: Truck },
        { label: 'Produksi', path: '/produksi', icon: Package },
      ],
    },
    {
      label: 'Keuangan',
      items: [
        { label: 'Invoice', path: '/invoice', icon: FileText },
        { label: 'Pengeluaran', path: '/pengeluaran', icon: Wallet },
        { label: 'Laporan', path: '/laporan', icon: TrendingUp },
      ],
    },
    {
      label: 'Toko',
      items: [
        { label: 'Pelanggan', path: '/pelanggan', icon: Users },
        { label: 'Pegawai', path: '/pegawai', icon: Users },
        { label: 'Marketing', path: '/marketing', icon: Megaphone },
        { label: 'Pengaturan', path: '/pengaturan', icon: Settings2 },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Fixed Sidebar with groups */}
      <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen overflow-y-auto z-40">
        <div className="h-[52px] flex items-center gap-2 px-4 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">TK</div>
          <span className="font-bold text-sm text-slate-900">Toko Kita</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5">
          {groups.map(g => (
            <div key={g.label}>
              <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{g.label}</p>
              <div className="space-y-0.5">
                {g.items.map(m => (
                  <NavLink key={m.path} to={m.path}
                    className={({ isActive }) => `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                    {({ isActive }) => (
                      <>
                        <m.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                        {m.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">Admin · Toko Kita</p>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[52px] bg-white border-b border-slate-200 px-4 flex items-center justify-between z-30 sticky top-0 shadow-sm">
          <span className="font-bold text-sm text-slate-900 capitalize">
            {location.pathname === '/' ? 'Grafik' : location.pathname.slice(1).replace('-', ' ')}
          </span>
          <div className="flex items-center gap-2">
            <NavLink to="/pos" className="h-9 px-3 flex items-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition">
              <Monitor className="w-3.5 h-3.5" /> Buka Kasir
            </NavLink>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
