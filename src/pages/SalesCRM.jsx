import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { getStore, setStore, seedErpModules } from '../lib/erpModulesStore';
import { ShoppingBag, Users, CheckCircle, Clock, Plus } from 'lucide-react';

export default function SalesCRM() {
  const [orders, setOrders] = useState([]);
  const [customer, setCustomer] = useState('');
  const [total, setTotal] = useState('');
  const [salesPerson, setSalesPerson] = useState('Admin');

  useEffect(() => {
    seedErpModules();
    setOrders(getStore('tk_sales'));
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!customer || !total) return;
    const newSO = {
      id: `SO-${Date.now().toString().slice(-4)}`,
      customer,
      date: new Date().toISOString().split('T')[0],
      total: parseInt(total, 10),
      status: 'Quotation',
      salesPerson
    };
    const updated = [newSO, ...orders];
    setOrders(updated);
    setStore('tk_sales', updated);
    setCustomer('');
    setTotal('');
  };

  const updateStatus = (id, status) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    setStore('tk_sales', updated);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Penjualan & CRM (Sales)</h1>
        <p className="text-sm text-muted-foreground">Kelola Quotation, Sales Order, dan pipeline prospek pelanggan.</p>
      </div>

      <Card className="card">
        <CardHeader>
          <CardTitle className="text-base">Buat Penawaran / Pesanan Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input
              placeholder="Nama Pelanggan / Perusahaan"
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              className="inp text-sm"
            />
            <Input
              type="number"
              placeholder="Total Estimasi (Rp)"
              value={total}
              onChange={e => setTotal(e.target.value)}
              className="inp text-sm"
            />
            <Input
              placeholder="Sales Person"
              value={salesPerson}
              onChange={e => setSalesPerson(e.target.value)}
              className="inp text-sm"
            />
            <Button type="submit" className="btn-primary w-full">
              <Plus className="w-4 h-4 mr-1" /> Buat Penawaran
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="card">
        <CardHeader>
          <CardTitle className="text-base">Daftar Sales Order & Quotation</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID / Tanggal</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total (Rp)</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}<br/><span className="text-muted-foreground">{o.date}</span></TableCell>
                  <TableCell className="font-medium">{o.customer}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.salesPerson}</TableCell>
                  <TableCell>
                    <Badge variant={o.status === 'Done' ? 'default' : o.status === 'Confirmed' ? 'secondary' : 'outline'}>
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">Rp {o.total.toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-center space-x-2">
                    {o.status === 'Quotation' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, 'Confirmed')}>
                        Confirm
                      </Button>
                    )}
                    {o.status === 'Confirmed' && (
                      <Button size="sm" variant="default" onClick={() => updateStatus(o.id, 'Done')}>
                        Selesai
                      </Button>
                    )}
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
