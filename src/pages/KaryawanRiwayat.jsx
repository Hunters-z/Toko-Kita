// Riwayat absensi pribadi karyawan.
import Attendance from '../components/AbsensiPanel.jsx'

export default function KaryawanRiwayat({ session }) {
  return <Attendance mode="pegawai" session={session} onlyHistory />
}
