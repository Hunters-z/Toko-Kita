// Layout aplikasi ADMIN — akses penuh semua modul + tombol logout.
// Linear-style: sidebar fixed kiri, content scroll, clean borders, no shadows.
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, ShoppingCart, Package, ReceiptText, Wallet, BarChart3, Users,
  Building2, Briefcase, Truck, Gift, Settings, Menu, Search, Bell, X, LogOut,
  Globe, Megaphone, Target, UserCog, PackageCheck, Handshake, PieChart, ShoppingBag, CalendarCheck, ClipboardList
} from 'lucide-react'
import { loadDB } from '../lib/store.js'
import { logout } from '../lib/session.js'
import { Icon } from './ui/icon.jsx'

const navGroups = [
  {
    title: 'Utama',
    items: [
      { to: '/', icon: LayoutDashboard, name: 'Dasbor' },
      { to: '/pos', icon: ShoppingCart, name: 'Kasir' },
      { to: '/belanja', icon: ShoppingBag, name: 'Toko Online', target: '_blank' },
    ]
  },
  {
    title: 'Operasional',
    items: [
      { to: '/inventori', icon: Package, name: 'Inventori' },
      { to: '/pembelian', icon: PackageCheck, name: 'Pembelian' },
      { to: '/pemasok', icon: Building2, name: 'Pemasok' },
      { to: '/produksi', icon: Gift, name: 'Produksi' },
      { to: '/stock-opname', icon: ClipboardList, name: 'Stock Opname' },
      { to: '/supply-chain', icon: Truck, name: 'Supply Chain' },
    ]
  },
  {
    title: 'Keuangan',
    items: [
      { to: '/invoice', icon: ReceiptText, name: 'Invoice' },
      { to: '/sales', icon: Handshake, name: 'Penjualan CRM' },
      { to: '/pelanggan', icon: Users, name: 'Pelanggan' },
      { to: '/keuangan', icon: PieChart, name: 'Keuangan' },
      { to: '/pengeluaran', icon: Wallet, name: 'Pengeluaran' },
      { to: '/laporan', icon: BarChart3, name: 'Laporan' },
    ]
  },
  {
    title: 'SDM',
    items: [
      { to: '/pegawai', icon: Briefcase, name: 'Pegawai' },
      { to: '/absen', icon: CalendarCheck, name: 'Absensi' },
      { to: '/hr', icon: UserCog, name: 'SDM' },
      { to: '/marketing', icon: Megaphone, name: 'Marketing' },
      { to: '/website', icon: Globe, name: 'Website' },
      { to: '/pengaturan', icon: Settings, name: 'Pengaturan' },
    ]
  },
]

export default function AdminLayout() {
  const [lowStock, setLowStock] = useState(0)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const nav2 = useNavigate()
  useEffect(() => {
    setLowStock(loadDB().products.filter(p => p.stock <= p.minStock).length)
    setOpen(false)
  }, [pathname])
  const doLogout = () => { logout(); nav2('/login') }

  const NavLinks = ({ onClick }) => (
    <nav className="space-y-1">
      {navGroups.map((group) => (
        <div key={group.title}>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3 mb-1.5 mt-4 font-semibold">
            {group.title}
          </div>
          <div className="space-y-0.5">
            {group.items.map(it => (
              <NavLink key={it.to} to={it.to} end={it.to === '/'} onClick={onClick}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
                  ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}
                `}>
                <Icon as={it.icon} size="sm" />
                {it.name}
                {it.to === '/inventori' && lowStock > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {lowStock}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] border-r border-border bg-card sticky top-0 h-screen overflow-y-auto">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary grid place-items-center text-primary-foreground text-sm font-bold">
              T
            </div>
            <div className="font-display font-bold text-base text-foreground">
              Toko<span className="text-primary">Kita</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-3">
          <NavLinks />
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3">
          <button onClick={doLogout} 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full">
            <Icon as={LogOut} size="sm" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary grid place-items-center text-primary-foreground text-xs font-bold">
              T
            </div>
            <span className="font-display font-bold text-sm">TokoKita</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen(true)} aria-label="Menu">
              <Icon as={Menu} size="md" className="text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 z-50 bg-card w-[280px] md:hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary grid place-items-center text-primary-foreground text-sm font-bold">
                  T
                </div>
                <span className="font-display font-bold text-base">TokoKita</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Tutup">
                <Icon as={X} size="md" className="text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 py-4 overflow-y-auto">
              <NavLinks onClick={() => setOpen(false)} />
            </div>
            <div className="border-t border-border p-4">
              <button onClick={() => { doLogout(); setOpen(false); }} 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full">
                <Icon as={LogOut} size="sm" />
                Keluar
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-14 md:pt-0 min-w-0 pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
