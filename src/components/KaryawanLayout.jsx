// Layout aplikasi KARYAWAN — hanya 3 fitur: Absen, Riwayat Absensi, Profil.
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { loadDB } from '../lib/store.js'
import { logout } from '../lib/session.js'
import { Icon } from './ui/icon.jsx'
import { CalendarCheck, History, UserRound, Menu, X, LogOut } from 'lucide-react'

const nav = [
  { to: '/karyawan/absen', icon: CalendarCheck, name: 'Absen' },
  { to: '/karyawan/riwayat', icon: History, name: 'Riwayat Absensi' },
  { to: '/karyawan/profil', icon: UserRound, name: 'Profil Saya' },
]

export default function KaryawanLayout() {
  const [open, setOpen] = useState(false)
  const nav2 = useNavigate()
  const session = JSON.parse(localStorage.getItem('tk_session') || 'null')
  const db = loadDB()
  const me = db.employees.find(e => e.id === session?.employeeId)
  const doLogout = () => { logout(); nav2('/login') }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 px-3 md:px-5 pt-3">
        <div className="flex items-center gap-2 bg-white rounded-full shadow-soft pl-4 pr-2 h-14 border border-line max-w-2xl mx-auto">
          <button className="md:hidden text-ink" onClick={()=>setOpen(true)} aria-label="Buka menu" title="Buka menu">
            <Icon as={Menu} size="md" />
          </button>
          <div className="font-disp font-extrabold flex items-center gap-2 text-ink">
            <span className="w-8 h-8 rounded-full bg-hero grid place-items-center text-sm text-white">T</span>
            <span className="hidden sm:inline">Toko<span className="text-hero">Kita</span></span>
          </div>
          <div className="hidden md:flex items-center gap-1 ml-4 flex-1">
            {nav.map(it => (
              <NavLink key={it.to} to={it.to}
                className={({isActive}) => 'px-4 py-2 rounded-full text-[13px] font-medium ' + (isActive?'bg-hero text-white font-semibold':'text-inksoft hover:text-ink')}>
                {it.name}
              </NavLink>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-hero-soft text-hero grid place-items-center font-bold text-xs" title={me?.name}>
              {(me?.name || 'K').slice(0,2).toUpperCase()}
            </div>
            <button onClick={doLogout} className="grid w-10 h-10 place-items-center rounded-full bg-card2 text-inksoft hover:text-coral" aria-label="Keluar" title="Keluar">
              <Icon as={LogOut} size="md" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex max-w-2xl mx-auto px-3 md:px-5">
        <aside className="hidden md:flex flex-col bg-white border border-line rounded-2xl shadow-soft w-[210px] shrink-0 p-3 sticky top-[76px] h-fit mt-3">
          <div className="text-[10px] uppercase tracking-widest text-dim px-3 mt-1 mb-2">Menu Karyawan</div>
          {nav.map(it => (
            <NavLink key={it.to} to={it.to}
              className={({isActive}) => 'flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13.5px] font-medium transition-colors ' +
                (isActive ? 'bg-hero text-white font-semibold' : 'text-inksoft hover:bg-card2 hover:text-ink')}>
              <Icon as={it.icon} size="md" />{it.name}
            </NavLink>
          ))}
          <button onClick={doLogout} className="mt-2 flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13.5px] font-medium text-coral hover:bg-coral/10">
            <Icon as={LogOut} size="md"/> Keluar
          </button>
          <div className="mt-3 text-[10.5px] text-dim px-3 py-2">Masuk sebagai {me?.name || 'karyawan'}</div>
        </aside>

        {open && <>
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={()=>setOpen(false)}/>
          <aside className="fixed left-0 top-0 bottom-0 z-50 bg-white w-64 p-3.5 md:hidden flex flex-col rounded-r-2xl">
            <div className="font-disp font-extrabold text-ink flex items-center gap-2 px-2 mb-4">
              <span className="w-8 h-8 rounded-full bg-hero grid place-items-center text-sm text-white">T</span> Toko<span className="-ml-2 text-hero">Kita</span>
              <button className="ml-auto text-inksoft" onClick={()=>setOpen(false)} aria-label="Tutup" title="Tutup">
                <Icon as={X} size="md" />
              </button>
            </div>
            {nav.map(it => (
              <NavLink key={it.to} to={it.to} onClick={()=>setOpen(false)}
                className={({isActive}) => 'flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13.5px] font-medium ' +
                  (isActive ? 'bg-hero text-white font-semibold' : 'text-inksoft hover:bg-card2 hover:text-ink')}>
                <Icon as={it.icon} size="md" />{it.name}
              </NavLink>
            ))}
            <button onClick={doLogout} className="flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[14px] font-medium text-coral hover:bg-coral/10 mt-2">
              <Icon as={LogOut} size="md"/> Keluar
            </button>
          </aside>
        </>}

        <main className="flex-1 min-w-0 pb-24 md:pb-4"><Outlet/></main>
      </div>

      <nav className="md:hidden fixed bottom-3 inset-x-3 z-40 bg-white rounded-full shadow-pop border border-line flex h-16">
        {nav.map(it => (
          <NavLink key={it.to} to={it.to}
            className={({isActive}) => 'flex-1 flex flex-col items-center justify-center gap-0.5 text-[9.5px] font-semibold rounded-full ' + (isActive?'bg-card2 text-hero':'text-inksoft')}>
            <Icon as={it.icon} size="md" />{it.name}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
