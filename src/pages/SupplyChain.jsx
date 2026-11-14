import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { getStore, seedErpModules } from '../lib/erpModulesStore';
import { Package, AlertTriangle, Truck } from 'lucide-react';

export default function SupplyChain() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    seedErpModules();
    setItems(getStore('tk_scm'));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Supply Chain Management</h1>
        <p className="text-sm text-muted-foreground">Monitoring Purchase Order (PO) dan status pengiriman barang dari pemasok.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PO Pending (In Transit)</CardTitle>
            <Truck className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{items.filter(i => i.status === 'Shipping').length}</div></CardContent>
        </Card>
        <Card className="card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-500">Low Stock Alert</CardTitle>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">3</div></CardContent>
        </Card>
      </div>

      <Card className="card">
        <CardHeader><CardTitle className="text-base">Status Pengadaan Barang</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO ID</TableHead>
                <TableHead>Pemasok</TableHead>
                <TableHead>Barang</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ETA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(i => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.id}</TableCell>
                  <TableCell>{i.supplier}</TableCell>
                  <TableCell>{i.item}</TableCell>
                  <TableCell>{i.qty}</TableCell>
                  <TableCell><Badge variant={i.status === 'Shipping' ? 'outline' : 'default'}>{i.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{i.eta}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
