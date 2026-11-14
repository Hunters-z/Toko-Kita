import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { getStore, setStore, seedErpModules } from '../lib/erpModulesStore';
import { DollarSign, TrendingUp, TrendingDown, Plus, Wallet } from 'lucide-react';

export default function Finance() {
  const [records, setRecords] = useState([]);
  const [type, setType] = useState('Pemasukan');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    seedErpModules();
    setRecords(getStore('tk_finance'));
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!amount || !category) return;
    const newRec = {
      id: `FIN-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      type,
      category,
      amount: parseInt(amount, 10),
      note: note || '-',
      account: 'Kas Utama'
    };
    const updated = [newRec, ...records];
    setRecords(updated);
    setStore('tk_finance', updated);
    setCategory('');
    setAmount('');
    setNote('');
  };

  const totalIn = records.filter(r => r.type === 'Pemasukan').reduce((acc, r) => acc + r.amount, 0);
  const totalOut = records.filter(r => r.type === 'Pengeluaran').reduce((acc, r) => acc + r.amount, 0);
  const balance = totalIn - totalOut;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Keuangan & Akuntansi (Finance)</h1>
          <p className="text-sm text-muted-foreground">Buku kas, arus kas (cashflow), dan pencatatan pemasukan & pengeluaran Odoo-style.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Kas & Bank</CardTitle>
            <Wallet className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {balance.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground mt-1">Total kas bersih tersedia</p>
          </CardContent>
        </Card>

        <Card className="card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Total Pemasukan</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Rp {totalIn.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground mt-1">Semua transaksi masuk</p>
          </CardContent>
        </Card>

        <Card className="card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-600">Total Pengeluaran</CardTitle>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">Rp {totalOut.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground mt-1">Biaya operasional & belanja</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card">
        <CardHeader>
          <CardTitle className="text-base">Pencatatan Transaksi Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="inp text-sm"
            >
              <option value="Pemasukan">Pemasukan (+)</option>
              <option value="Pengeluaran">Pengeluaran (-)</option>
            </select>
            <Input
              placeholder="Kategori (misal: Sewa, Penjualan)"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="inp text-sm"
            />
            <Input
              type="number"
              placeholder="Jumlah (Rp)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="inp text-sm"
            />
            <Input
              placeholder="Catatan / Keterangan"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="inp text-sm"
            />
            <Button type="submit" className="btn-primary w-full">
              <Plus className="w-4 h-4 mr-1" /> Catat
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="card">
        <CardHeader>
          <CardTitle className="text-base">Jurnal Kas & Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID / Tanggal</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Jumlah (Rp)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}<br/><span className="text-muted-foreground">{r.date}</span></TableCell>
                  <TableCell>
                    <Badge variant={r.type === 'Pemasukan' ? 'default' : 'destructive'}>
                      {r.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{r.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.note}</TableCell>
                  <TableCell className={`text-right font-bold ${r.type === 'Pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {r.type === 'Pemasukan' ? '+' : '-'} Rp {r.amount.toLocaleString('id-ID')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
