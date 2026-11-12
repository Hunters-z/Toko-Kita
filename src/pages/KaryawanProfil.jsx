// Halaman Profil Saya Karyawan
import { useState } from 'react'
import { loadDB, saveDB } from '../lib/store.js'
import { getPegawaiSession } from '../lib/session.js'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { Label } from '../components/ui/label.jsx'
import { toast } from '../components/ui/use-toast.jsx'

export default function KaryawanProfil() {
  const db = loadDB()
  const session = getPegawaiSession(db)
  const [emp, setEmp] = useState(() => db.employees.find(e => e.id === session?.employeeId) || {})
  const [pinLama, setPinLama] = useState('')
  const [pinBaru, setPinBaru] = useState('')

  const handleUpdate = e => {
    e.preventDefault()
    if (pinBaru && String(emp.pin || '') !== String(pinLama)) {
      toast({ title: 'PIN Lama salah', description: 'Masukkan PIN lama dengan benar untuk mengganti PIN.', variant: 'destructive' })
      return
    }
    const idx = db.employees.findIndex(x => x.id === emp.id)
    if (idx >= 0) {
      if (pinBaru) emp.pin = pinBaru
      db.employees[idx] = emp
      saveDB(db)
      toast({ title: 'Profil diperbarui', description: 'Data Anda berhasil disimpan.' })
      setPinLama('')
      setPinBaru('')
    }
  }

  return (
    <div className="p-4 md:p-7 max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold font-disp">Profil Karyawan</h1>
        <p className="text-sm text-muted">Informasi akun dan pengaturan PIN Anda.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Identitas Anda</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label>Nama Lengkap</Label>
              <Input value={emp.name || ''} disabled className="bg-muted/30" />
            </div>
            <div>
              <Label>Username (untuk login)</Label>
              <Input value={emp.username || ''} disabled className="bg-muted/30" />
            </div>
            <div>
              <Label>Jabatan</Label>
              <Input value={emp.role || ''} disabled className="bg-muted/30" />
            </div>
            <div className="pt-2 border-t border-border">
              <h3 className="text-sm font-semibold mb-3">Ganti PIN Akses</h3>
              <div className="space-y-3">
                <div>
                  <Label>PIN Lama</Label>
                  <Input type="password" maxLength={6} value={pinLama} onChange={e=>setPinLama(e.target.value)} placeholder="••••" />
                </div>
                <div>
                  <Label>PIN Baru (4-6 angka)</Label>
                  <Input type="password" maxLength={6} value={pinBaru} onChange={e=>setPinBaru(e.target.value)} placeholder="••••" />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4">Simpan Perubahan</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
