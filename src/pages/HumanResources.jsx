import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { getStore, seedErpModules } from '../lib/erpModulesStore';
import { UserCog, Clock, Award } from 'lucide-react';

export default function HumanResources() {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    seedErpModules();
    setEmployees(getStore('tk_hr'));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Human Resources (SDM)</h1>
        <p className="text-sm text-muted-foreground">Kelola data karyawan, departemen, dan struktur gajinya secara terpusat.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card"><CardHeader className="pb-2"><CardTitle>Total Karyawan</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{employees.length}</CardContent></Card>
        <Card className="card"><CardHeader className="pb-2"><CardTitle>Departemen</CardTitle></CardHeader><CardContent className="text-2xl font-bold">4</CardContent></Card>
        <Card className="card"><CardHeader className="pb-2"><CardTitle>Karyawan Aktif</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-emerald-600">{employees.filter(e => e.status === 'Aktif').length}</CardContent></Card>
      </div>

      <Card className="card">
        <CardHeader><CardTitle className="text-base">Struktur & Data SDM</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIK</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead className="text-right">Gaji Pokok</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{e.id}</TableCell>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{e.role}</TableCell>
                  <TableCell className="text-muted-foreground">{e.department}</TableCell>
                  <TableCell className="text-right font-bold">Rp {e.salary.toLocaleString('id-ID')}</TableCell>
                  <TableCell><Badge variant="outline">{e.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
