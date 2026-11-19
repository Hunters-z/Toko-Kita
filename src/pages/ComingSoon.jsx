import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx'
import { Icon } from '../components/ui/icon.jsx'
import { Construction } from 'lucide-react'

export default function ComingSoon({ title }) {
  return (
    <div className="p-4 md:p-7 max-w-xl mx-auto text-center space-y-6">
      <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl grid place-items-center mx-auto shadow-sm">
        <Icon as={Construction} size="xl" />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold font-disp text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">Fitur ini sedang dalam tahap pengembangan dengan standar modul Odoo ERP.</p>
      </div>
      <Card className="border-dashed bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-center">Status Pengembangan</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nantikan pembaruan berikutnya untuk modul manajemen personalia lengkap (pengajuan izin, slip gaji digital, dan klaim pengeluaran).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
