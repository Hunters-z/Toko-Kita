import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { loadDB } from './lib/store.js'
import { getAdminSession, getPegawaiSession } from './lib/session.js'
import AdminLayout from './components/AdminLayout.jsx'
import KaryawanLayout from './components/KaryawanLayout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import POS from './pages/POS.jsx'
import Inventory from './pages/Inventory.jsx'
import Invoices from './pages/Invoices.jsx'
import Customers from './pages/Customers.jsx'
import Suppliers from './pages/Suppliers.jsx'
import Expenses from './pages/Expenses.jsx'
import Reports from './pages/Reports.jsx'
import Employees from './pages/Employees.jsx'
import Attendance from './pages/Attendance.jsx'
import Purchases from './pages/Purchases.jsx'
import Bundles from './pages/Bundles.jsx'
import Finance from './pages/Finance.jsx'
import SalesCRM from './pages/SalesCRM.jsx'
import WebsiteBuilder from './pages/WebsiteBuilder.jsx'
import SupplyChain from './pages/SupplyChain.jsx'
import HumanResources from './pages/HumanResources.jsx'
import Marketing from './pages/Marketing.jsx'
import SettingsPage from './pages/Settings.jsx'
import KaryawanAbsen from './pages/KaryawanAbsen.jsx'
import KaryawanRiwayat from './pages/KaryawanRiwayat.jsx'
import KaryawanProfil from './pages/KaryawanProfil.jsx'
import KaryawanPOS from './pages/KaryawanPOS.jsx'
import ComingSoon from './pages/ComingSoon.jsx'
import PublicStore from './pages/PublicStore.jsx'
import { Toaster } from './components/ui/toaster.jsx'

const Protected = ({ role, children }) => {
  const db = loadDB()
  const admin = getAdminSession()
  const pegawai = getPegawaiSession(db)
  const loc = useLocation()
  if (role === 'admin' && !admin) return <Navigate to="/login" state={{ dari: loc.pathname }} replace />
  if (role === 'karyawan' && !pegawai) return <Navigate to="/login" state={{ dari: loc.pathname }} replace />
  return children
}

export default function App() {
  const db = loadDB()
  const admin = getAdminSession()
  const pegawai = getPegawaiSession(db)

  return (
    <>
      <Routes>
        <Route path="/login" element={admin ? <Navigate to="/" replace/> : pegawai ? <Navigate to="/karyawan/absen" replace/> : <Login/>} />

        <Route path="/" element={<Protected role="admin"><AdminLayout/></Protected>}>
           <Route index element={<Dashboard/>}/>
           <Route path="pos" element={<POS/>}/>
           <Route path="inventori" element={<Inventory/>}/>
           <Route path="invoice" element={<Invoices/>}/>
           <Route path="pelanggan" element={<Customers/>}/>
           <Route path="pemasok" element={<Suppliers/>}/>
           <Route path="pengeluaran" element={<Expenses/>}/>
           <Route path="laporan" element={<Reports/>}/>
           <Route path="pegawai" element={<Employees/>}/>
           <Route path="absen" element={<Attendance/>}/>
           <Route path="pembelian" element={<Purchases/>}/>
           <Route path="produksi" element={<Bundles/>}/>
           <Route path="keuangan" element={<Finance/>}/>
           <Route path="sales" element={<SalesCRM/>}/>
           <Route path="website" element={<WebsiteBuilder/>}/>
           <Route path="supply-chain" element={<SupplyChain/>}/>
           <Route path="hr" element={<HumanResources/>}/>
           <Route path="marketing" element={<Marketing/>}/>
           <Route path="pengaturan" element={<SettingsPage/>}/>
           <Route path="sales" element={<SalesCRM/>}/>
           <Route path="website" element={<WebsiteBuilder/>}/>
           <Route path="supply-chain" element={<SupplyChain/>}/>
           <Route path="hr" element={<HumanResources/>}/>
           <Route path="marketing" element={<Marketing/>}/>
           <Route path="pengaturan" element={<SettingsPage/>}/>
        </Route>

        <Route path="/karyawan" element={<Protected role="karyawan"><KaryawanLayout/></Protected>}>
           <Route path="absen" element={<KaryawanAbsen session={pegawai}/>}/>
           <Route path="riwayat" element={<KaryawanRiwayat session={pegawai}/>}/>
           <Route path="profil" element={<KaryawanProfil session={pegawai}/>}/>
           <Route path="pos" element={<KaryawanPOS/>}/>
           <Route path="izin" element={<ComingSoon title="Izin / Cuti"/>}/>
           <Route path="gaji" element={<ComingSoon title="Slip Gaji"/>}/>
        </Route>

        <Route path="*" element={<Navigate to={admin ? '/' : pegawai ? '/karyawan/absen' : '/login'} replace />} />
        <Route path="/belanja" element={<PublicStore/>}/>
      </Routes>
      <Toaster />
    </>
  )
}
