import { useState } from 'react'
import { loadDB, saveDB, rp } from '../lib/store.js'
import { Card } from './Dashboard.jsx'
import { Icon } from '@/components/ui/icon.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Input as ShadInput } from '@/components/ui/input.jsx'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table.jsx'
import { Package, PackagePlus, TriangleAlert, CheckCircle2 } from 'lucide-react'
// Palette v0.2: ocean/navy

export default function Inventory() {
  const [db, setDb] = useState(loadDB())
  const [form, setForm] = useState({name:'', price:'', stock:'', minStock:''})
  const add = e => {
    e.preventDefault()
    const next = {...db, products: [...db.products, {...form, id:'p'+Date.now(), price:+form.price, stock:+form.stock, minStock:+form.minStock||0}]}
    saveDB(next); setDb(next); setForm({name:'', price:'', stock:'', minStock:''})
  }
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2.5 mb-6">
        <Icon as={Package} size="lg" className="text-hero" />
        <h1 className="font-disp text-lg md:text-xl font-extrabold">Inventori</h1>
      </div>
      <Card title="Daftar produk">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead><TableHead>Harga</TableHead><TableHead>Stok</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {db.products.map(p => (
              <TableRow key={p.id}>
                <TableCell><b>{p.name}</b></TableCell>
                <TableCell>{rp(p.price)}</TableCell>
                <TableCell>{p.stock}</TableCell>
                <TableCell>{p.stock<=p.minStock ? <Badge variant="destructive" className="gap-1"><Icon as={TriangleAlert} size="sm" strokeWidth={1.5}/> Restock</Badge> : <Badge variant="success" className="gap-1"><Icon as={CheckCircle2} size="sm" strokeWidth={1.5}/> Aman</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <form onSubmit={add} className="mt-4 bg-white border border-line rounded-2xl p-5 flex flex-wrap gap-2.5 items-end">
        <Input label="Nama" value={form.name} onChange={v=>setForm({...form,name:v})} required/>
        <Input label="Harga" type="number" value={form.price} onChange={v=>setForm({...form,price:v})} required/>
        <Input label="Stok" type="number" value={form.stock} onChange={v=>setForm({...form,stock:v})} required/>
        <Input label="Min. stok" type="number" value={form.minStock} onChange={v=>setForm({...form,minStock:v})}/>
        <Button size="sm" type="submit" className="gap-1.5"><Icon as={PackagePlus} size="sm" strokeWidth={1.5}/> Tambah produk</Button>
      </form>
    </div>
  )
}
export function Input({label,...props}) {
  return (
    <label className="flex flex-col gap-1">
      <Label>{label}</Label>
      <ShadInput className="w-36 h-9 text-[13px]" {...props}/>
    </label>
  )
}