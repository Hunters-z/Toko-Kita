import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { getStore, seedErpModules } from '../lib/erpModulesStore';
import { loadDB, saveDB } from '../lib/store.js';
import { ShoppingBag, ShoppingCart, CheckCircle2, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PublicStore() {
  const navigate = useNavigate();
  const [website, setWebsite] = useState({});
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [txStatus, setTxStatus] = useState(null);

  useEffect(() => {
    seedErpModules();
    setWebsite(getStore('tk_website'));
    const db = loadDB();
    setProducts(db.products || []);
  }, []);

  const addToCart = (p) => {
    const existing = cart.find(item => item.id === p.id);
    if (existing) {
      if (existing.qty >= p.stock) { alert('Stok tidak cukup!'); return; }
      setCart(cart.map(item => item.id === p.id ? {...item, qty: item.qty + 1} : item));
    } else {
      setCart([...cart, {...p, qty: 1}]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const checkout = () => {
    if (!buyerName || !buyerPhone) { alert('Mohon isi nama dan nomor HP Anda.'); return; }
    if (cart.length === 0) { alert('Keranjang masih kosong.'); return; }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const txId = 'TX-' + Date.now();
    
    const db = loadDB();
    const currentTransactions = db.txs || [];
    const currentProducts = db.products || [];
    
    const newTransaction = {
      id: txId,
      date: new Date().toISOString(),
      items: cart.map(i => ({ ...i })),
      sub: total,
      disc: 0,
      tax: 0,
      total: total,
      method: 'Online Store',
      customer: `${buyerName} - ${buyerPhone}`,
      status: 'selesai'
    };

    db.txs = [newTransaction, ...currentTransactions];
    
    // Update Inventory
    db.products = currentProducts.map(p => {
      const bought = cart.find(c => c.id === p.id);
      if (bought) {
        return {...p, stock: p.stock - bought.qty};
      }
      return p;
    });

    saveDB(db);

    setTxStatus({ success: true, txId: txId, total: total });
    setCart([]);
  };

  if (txStatus?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <Card className="w-full max-w-md border-green-200 bg-white shadow-sm">
          <CardContent className="pt-6">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pesanan Berhasil!</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Nomor Transaksi: <span className="font-mono font-bold text-gray-900">{txStatus.txId}</span><br/>
              Total: <span className="font-bold text-gray-900">Rp{txStatus.total.toLocaleString('id-ID')}</span>
            </p>
            <div className="mt-6 space-y-3">
              <Button onClick={() => navigate('/pos')} className="w-full bg-orange-500 hover:bg-orange-600">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Tandai Selesai di POS
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">Belanja Lagi</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-lg">T</div>
            <h1 className="text-3xl font-black tracking-tighter text-gray-900">Toko<b className="text-orange-500">Kita</b></h1>
          </div>
          <p className="text-gray-600">{website?.heroSubtitle || 'Belanja mudah, cepat, dan aman bersama kami.'}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Catalog */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Katalog Produk</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.filter(p => p.stock > 0).map(p => (
              <Card key={p.id} className="bg-white shadow-sm border-gray-200">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold line-clamp-2">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="text-orange-500 font-black text-lg">Rp{p.price.toLocaleString('id-ID')}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold mb-4">Stok: {p.stock} tersedia</div>
                  <Button size="sm" className="w-full bg-gray-900 hover:bg-orange-500 transition-colors" onClick={() => addToCart(p)}>
                    <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Keranjang
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        {cart.length > 0 && (
          <Card className="bg-white shadow-sm border-gray-200">
            <CardHeader className="p-5">
              <CardTitle className="flex items-center gap-2 font-bold text-lg"><ShoppingBag className="w-5 h-5 text-orange-500" /> Keranjang Belanja</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                    <div>
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.qty} x Rp{item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-sm">Rp{(item.price * item.qty).toLocaleString('id-ID')}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-xs font-bold uppercase">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center gap-3">
                   <Phone className="w-4 h-4 text-gray-400" />
                   <div className="flex-1 space-y-2">
                     <div className="grid grid-cols-2 gap-2">
                         <Input placeholder="Nama Pelanggan" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="bg-gray-50 border-gray-200"/>
                         <Input placeholder="No. WhatsApp (08xx...)" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="bg-gray-50 border-gray-200"/>
                     </div>
                   </div>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-gray-500 font-medium">Total Belanja</span>
                   <span className="font-black text-xl text-gray-900">Rp{cart.reduce((s,i) => s + i.price*i.qty, 0).toLocaleString('id-ID')}</span>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-base shadow-lg shadow-orange-500/20" onClick={checkout}>
                  Checkout Sekarang
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}