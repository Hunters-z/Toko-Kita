import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
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
import SettingsPage from './pages/Settings.jsx'
import { Toaster } from './components/ui/use-toast.jsx'

export default function App() {
  return (
    <>
      <Routes>
      <Route element={<Layout/>}>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/pos" element={<POS/>}/>
        <Route path="/inventori" element={<Inventory/>}/>
        <Route path="/invoice" element={<Invoices/>}/>
        <Route path="/pelanggan" element={<Customers/>}/>
        <Route path="/pemasok" element={<Suppliers/>}/>
        <Route path="/pengeluaran" element={<Expenses/>}/>
        <Route path="/laporan" element={<Reports/>}/>
        <Route path="/pegawai" element={<Employees/>}/>
        <Route path="/absen" element={<Attendance/>}/>
        <Route path="/pembelian" element={<Purchases/>}/>
        <Route path="/produksi" element={<Bundles/>}/>
        <Route path="/pengaturan" element={<SettingsPage/>}/>
      </Route>
    </Routes>
    <Toaster />
    </>
  )
}