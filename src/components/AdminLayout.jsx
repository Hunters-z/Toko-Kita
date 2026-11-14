// Layout aplikasi ADMIN — akses penuh semua modul + tombol logout.
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, ShoppingCart, Package, ReceiptText, Wallet, BarChart3, Users,
  Building2, Briefcase, Truck, Gift, Settings, Menu, Search, Bell, X, LogOut,
  Globe, Megaphone, Target, UserCog, PackageCheck, Handshake, PieChart, ShoppingBag
} from 'lucide-react'
import { loadDB } from '../lib/store.js'
import { logout } from '../lib/session.js'
import { Icon } from './ui/icon.jsx'

const nav = [
  { to: '/', icon: LayoutDashboard, name: 'Dasbor' },
  { to: '/pos', icon: ShoppingCart, name: 'Kasir' },
  { to: '/inventori', icon: Package, name: 'Inventori' },
  { to: '/invoice', icon: ReceiptText, name: 'Invoice' },
  { to: '/keuangan', icon: PieChart, name: 'Keuangan' },
  { to: '/sales', icon: Handshake, name: 'Penjualan CRM' },
  { to: '/pelanggan', icon: Users, name: 'Pelanggan' },
  { to: '/pemasok', icon: Building2, name: 'Pemasok' },
  { to: '/supply-chain', icon: Truck, name: 'Supply Chain' },
  { to: '/hr', icon: UserCog, name: 'SDM' },
  { to: '/marketing', icon: Megaphone, name: 'Marketing' },
  { to: '/website', icon: Globe, name: 'Website' },
  { to: '/belanja', icon: ShoppingBag, name: 'Toko Online', target: '_blank' },
  { to: '/pengeluaran', icon: Wallet, name: 'Pengeluaran' },
  { to: '/laporan', icon: BarChart3, name: 'Laporan' },
  { to: '/pegawai', icon: Briefcase, name: 'Pegawai' },
  { to: '/absen', icon: null, name: 'Absensi', lucide: 'CalendarCheck' },
  { to: '/pembelian', icon: PackageCheck, name: 'Pembelian' },
  { to: '/produksi', icon: Gift, name: 'Produksi' },
  { to: '/pengaturan', icon: Settings, name: 'Pengaturan' },
]
const bottomNav = nav.filter(n => ['/','/pos','/inventori','/laporan','/pembelian'].includes(n.to))
// Icon Absensi diimpor langsung agar konsisten dengan ikon lain.
import { CalendarCheck } from 'lucide-react'
nav.find(n => n.to === '/absen').icon = CalendarCheck

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
  const NavLinks = ({onClick}) => nav.map(it => (
    <NavLink key={it.to} to={it.to} end={it.to==='/'} onClick={onClick}
      className={({isActive}) => 'flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13.5px] font-medium transition-colors ' +
        (isActive ? 'bg-hero text-white font-semibold' : 'text-inksoft hover:bg-card2 hover:text-ink')}>
      <Icon as={it.icon} size="md" />{it.name}
      {it.to==='/inventori' && lowStock>0 && <span className="ml-auto bg-coral text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{lowStock}</span>}
    </NavLink>
  ))
  return (
    <div className="min-h-screen bg-bg">
      {/* Header pill */}
      <header className="sticky top-0 z-40 px-3 md:px-5 pt-3">
        <div className="flex items-center gap-2 bg-white rounded-full shadow-soft pl-4 pr-2 h-14 border border-line max-w-6xl mx-auto">
          <button className="md:hidden text-ink" onClick={()=>setOpen(true)} aria-label="Buka menu" title="Buka menu">
            <Icon as={Menu} size="md" />
          </button>
          <div className="font-disp font-extrabold flex items-center gap-2 text-ink">
            <span className="w-8 h-8 rounded-full bg-hero grid place-items-center text-sm text-white">T</span>
            <span className="hidden sm:inline">Toko<span className="text-hero">Kita</span></span>
          </div>
          <div className="hidden lg:flex items-center gap-1 ml-6 flex-1">
            {nav.slice(0,7).map(it => (
              <NavLink key={it.to} to={it.to} end={it.to==='/'}
                className={({isActive}) => 'px-4 py-2 rounded-full text-[13px] font-medium ' + (isActive?'bg-hero text-white font-semibold':'text-inksoft hover:text-ink')}>
                {it.name}
              </NavLink>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="hidden md:grid w-10 h-10 place-items-center rounded-full bg-card2 text-inksoft hover:text-ink" aria-label="Cari" title="Cari">
              <Icon as={Search} size="md" />
            </button>
            <button className="hidden md:grid relative w-10 h-10 place-items-center rounded-full bg-card2 text-inksoft hover:text-ink" aria-label="Notifikasi" title="Notifikasi">
              <Icon as={Bell} size="md" />
              {lowStock>0 && <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-coral"/>}
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-hero to-gold grid place-items-center text-white font-bold text-sm" title="Admin">A</div>
            <button onClick={doLogout} className="grid w-10 h-10 place-items-center rounded-full bg-card2 text-inksoft hover:text-coral" aria-label="Keluar" title="Keluar">
              <Icon as={LogOut} size="md" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex max-w-6xl mx-auto px-3 md:px-5">
        {/* Sidebar kartu gelap */}
        <aside className="hidden md:flex flex-col bg-white border border-line rounded-2xl shadow-soft w-[220px] shrink-0 p-3 sticky top-[76px] h-[calc(100vh-96px)] mt-3">
          <div className="text-[10px] uppercase tracking-widest text-dim px-3 mt-1 mb-2">Menu Admin</div>
          <NavLinks/>
          <button onClick={doLogout} className="mt-2 flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13.5px] font-medium text-coral hover:bg-coral/10">
            <Icon as={LogOut} size="md"/> Keluar
          </button>
          <div className="text-[10.5px] text-dim px-3 py-2">© Toko Kita — data lokal</div>
        </aside>

        {open && <>
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={()=>setOpen(false)}/>
          <aside className="fixed left-0 top-0 bottom-0 z-50 bg-white w-64 p-3.5 md:hidden flex flex-col rounded-r-2xl overflow-y-auto">
            <div className="font-disp font-extrabold text-ink flex items-center gap-2 px-2 mb-4">
              <span className="w-8 h-8 rounded-full bg-hero grid place-items-center text-sm text-white">T</span> Toko<span className="-ml-2 text-hero">Kita</span>
              <button className="ml-auto text-inksoft" onClick={()=>setOpen(false)} aria-label="Tutup" title="Tutup">
                <Icon as={X} size="md" />
              </button>
            </div>
            <NavLinks onClick={()=>setOpen(false)}/>
            <button onClick={doLogout} className="flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[14px] font-medium text-coral hover:bg-coral/10 mt-2">
              <Icon as={LogOut} size="md"/> Keluar
            </button>
          </aside>
        </>}

        <main className="flex-1 min-w-0 pb-24 md:pb-4"><Outlet/></main>
      </div>

      {/* Bottom nav pill mengambang */}
      <nav className="md:hidden fixed bottom-3 inset-x-3 z-40 bg-white rounded-full shadow-pop border border-line flex h-16">
        {bottomNav.map(it => (
          <NavLink key={it.to} to={it.to} end={it.to==='/'}
            className={({isActive}) => 'flex-1 flex flex-col items-center justify-center gap-0.5 text-[9.5px] font-semibold rounded-full ' + (isActive?'bg-card2 text-hero':'text-inksoft')}>
            <Icon as={it.icon} size="md" />{it.name}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
