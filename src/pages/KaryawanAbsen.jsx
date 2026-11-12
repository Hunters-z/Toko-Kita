// Halaman Absen KARYAWAN — check-in/out selfie+GPS milik sendiri.
import Attendance from '../components/AbsensiPanel.jsx'

export default function KaryawanAbsen({ session }) {
  return <Attendance mode="pegawai" session={session} />
}
