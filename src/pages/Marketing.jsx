import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { getStore, setStore, seedErpModules } from '../lib/erpModulesStore';
import { Megaphone, BarChart3, Target } from 'lucide-react';

export default function Marketing() {
  const [campaigns, setCampaigns] = useState([]);
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('WhatsApp');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    seedErpModules();
    setCampaigns(getStore('tk_marketing'));
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name) return;
    const newCamp = {
      id: `CAM-${Date.now().toString().slice(-4)}`,
      name,
      channel,
      budget: parseInt(budget, 10) || 0,
      status: 'Aktif',
      leadCount: 0
    };
    const updated = [newCamp, ...campaigns];
    setCampaigns(updated);
    setStore('tk_marketing', updated);
    setName('');
    setBudget('');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pemasaran & Kampanye</h1>
        <p className="text-sm text-muted-foreground">Lacak kampanye promo dan efektivitas saluran pemasaran Anda.</p>
      </div>

      <Card className="card">
        <CardHeader><CardTitle className="text-base">Luncurkan Kampanye Baru</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input placeholder="Nama Kampanye" value={name} onChange={e => setName(e.target.value)} className="inp text-sm"/>
            <select value={channel} onChange={e => setChannel(e.target.value)} className="inp text-sm">
              <option>WhatsApp</option><option>SMS</option><option>Sosial Media</option><option>Email</option>
            </select>
            <Input type="number" placeholder="Anggaran (Rp)" value={budget} onChange={e => setBudget(e.target.value)} className="inp text-sm"/>
            <Button type="submit" className="btn-primary w-full"><Plus className="w-4 h-4 mr-1"/> Mulai</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="card">
        <CardHeader><CardTitle className="text-base">Daftar Kampanye & Metrik</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID / Nama Kampanye</TableHead>
                <TableHead>Saluran</TableHead>
                <TableHead>Anggaran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Leads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.id} - <strong>{c.name}</strong></TableCell>
                  <TableCell>{c.channel}</TableCell>
                  <TableCell>Rp {c.budget.toLocaleString('id-ID')}</TableCell>
                  <TableCell><Badge>{c.status}</Badge></TableCell>
                  <TableCell className="font-bold text-primary">{c.leadCount} Leads</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
