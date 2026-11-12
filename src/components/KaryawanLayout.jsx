// Layout aplikasi KARYAWAN — filter menu berbasis role (Kasir vs Karyawan Lain).
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { loadDB } from '../lib/store.js'
import { logout } from '../lib/session.js'
import { Icon } from './ui/icon.jsx'
import { CalendarCheck, History, UserRound, ShoppingCart, ShieldAlert, Banknote, Menu, X, LogOut } from 'lucide-react'

export default function KaryawanLayout() {
  const [open, setOpen] = useState(false)
  const nav2 = useNavigate()
  const session = JSON.parse(localStorage.getItem('tk_session') || 'null')
  const db = loadDB()
  const me = db.employees.find(e => e.id === session?.employeeId)
  const isKasir = (me?.role || '').toLowerCase().includes('kasir')

  const items = [
    ...(isKasir ? [{ to: '/karyawan/pos', icon: ShoppingCart, name: 'Kasir / POS' }] : []),
    { to: '/karyawan/absen', icon: CalendarCheck, name: 'Absen' },
    { to: '/karyawan/riwayat', icon: History, name: 'Riwayat Absensi' },
    { to: '/karyawan/izin', icon: ShieldAlert, name: 'Izin / Cuti' },
    { to: '/karyawan/gaji', icon: Banknote, name: 'Slip Gaji' },
    { to: '/karyawan/profil', icon: UserRound, name: 'Profil Saya' },
  ]

  const doLogout = () => { logout(); nav2('/login') }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 px-3 md:px-5 pt-3">
        <div className="flex items-center gap-2 bg-card rounded-full pl-4 pr-2 h-14 border border-border max-w-2xl mx-auto shadow-lg">
          <button className="md:hidden text-foreground" onClick={()=>setOpen(true)} aria-label="Buka menu" title="Buka menu">
            <Icon as={Menu} size="md" />
          </button>
          <div className="font-disp font-extrabold flex items-center gap-2 text-foreground">
            <span className="w-8 h-8 rounded-full bg-primary grid place-items-center text-sm text-primary-foreground font-bold font-disp">T</span>
            <span className="hidden sm:inline font-disp font-extrabold text-base">Toko<span className="text-primary">Kita</span></span>
          </div>
          <div className="hidden md:flex items-center gap-1 ml-4 flex-1">
            {items.map(it => (
              <NavLink key={it.to} to={it.to}
                className={({isActive}) => 'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ' + (isActive?'bg-primary text-primary-foreground shadow-sm':'text-muted hover:text-foreground hover:bg-muted/20')}>
                {it.name}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium hidden sm:inline">
              {me?.name || 'Karyawan'} · <span className="capitalize">{me?.role || 'Staff'}</span>
            </span>
            <button onClick={doLogout} className="w-9 h-9 rounded-full hover:bg-destructive/10 text-muted hover:text-destructive grid place-items-center transition-colors" title="Keluar">
              <Icon as={LogOut} size="sm" />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden" onClick={()=>setOpen(false)}>
          <div className="w-64 bg-card h-full p-5 border-r border-border space-y-4 shadow-xl" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <b className="font-disp">Menu Karyawan</b>
              <button onClick={()=>setOpen(false)}><Icon as={X} size="md" /></button>
            </div>
            <nav className="space-y-1">
              {items.map(it => (
                <NavLink key={it.to} to={it.to} onClick={()=>setOpen(false)}
                  className={({isActive}) => 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ' + (isActive?'bg-primary text-primary-foreground':'text-muted hover:text-foreground')}>
                  <Icon as={it.icon} size="sm" />
                  {it.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto py-5 px-3">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-3 inset-x-3 z-40 bg-card rounded-full shadow-pop border border-border flex h-16 p-1.5 backdrop-blur-md bg-card/90">
        {items.map(it => (
          <NavLink key={it.to} to={it.to}
            className={({isActive}) => 'flex-1 flex flex-col items-center justify-center gap-0.5 text-[9.5px] font-semibold rounded-full transition-colors ' + (isActive?'bg-primary/10 text-primary':'text-muted')}>
            <Icon as={it.icon} size="sm" />{it.name}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
