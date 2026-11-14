import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getStore, setStore, seedErpModules } from '../lib/erpModulesStore';
import { Globe, Settings, Save } from 'lucide-react';

export default function WebsiteBuilder() {
  const [data, setData] = useState({ heroTitle: '', heroSubtitle: '', contactPhone: '', isOnlineStoreActive: false });

  useEffect(() => {
    seedErpModules();
    setData(getStore('tk_website'));
  }, []);

  const handleSave = () => {
    setStore('tk_website', data);
    alert('Perubahan website tersimpan!');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Website & Online Store</h1>
        <p className="text-sm text-muted-foreground">Atur konten halaman depan dan status toko online Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4"/> Konfigurasi Konten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Hero Title</label>
              <Input value={data.heroTitle} onChange={e => setData({...data, heroTitle: e.target.value})} className="inp"/>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Subtitle</label>
              <Input value={data.heroSubtitle} onChange={e => setData({...data, heroSubtitle: e.target.value})} className="inp"/>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Nomor WhatsApp</label>
              <Input value={data.contactPhone} onChange={e => setData({...data, contactPhone: e.target.value})} className="inp"/>
            </div>
            <div className="flex items-center justify-between py-2 border-t mt-4">
              <label className="text-sm font-medium">Toko Online Aktif</label>
              <input type="checkbox" checked={data.isOnlineStoreActive} onChange={e => setData({...data, isOnlineStoreActive: e.target.checked})} className="w-5 h-5"/>
            </div>
            <Button onClick={handleSave} className="btn-primary w-full mt-4">
              <Save className="w-4 h-4 mr-2" /> Simpan Perubahan Website
            </Button>
          </CardContent>
        </Card>

        <Card className="card border-dashed">
            <CardHeader><CardTitle className="text-base">Preview Singkat</CardTitle></CardHeader>
            <CardContent className="p-8 text-center border rounded-xl bg-gray-50">
                <h1 className="text-3xl font-bold text-primary">{data.heroTitle}</h1>
                <p className="text-muted-foreground mt-2">{data.heroSubtitle}</p>
                <div className="mt-6">
                    <Button disabled variant="outline">Hubungi: {data.contactPhone}</Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
