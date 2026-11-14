// Light modular localStorage store for Toko Kita ERP (Odoo-like extensions)
// Keys: tk_finance, tk_sales, tk_website, tk_scm, tk_hr, tk_marketing

export const getStore = (key, defaultVal = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch {
    return defaultVal;
  }
};

export const setStore = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn(`Failed to save ${key}:`, e);
  }
};

// Seed initial mock data if empty
export const seedErpModules = () => {
  if (!localStorage.getItem('tk_finance')) {
    setStore('tk_finance', [
      { id: 'FIN-001', date: '2026-11-10', type: 'Pemasukan', category: 'Penjualan POS', amount: 3450000, note: 'Kasir Utama', account: 'Kas' },
      { id: 'FIN-002', date: '2026-11-11', type: 'Pengeluaran', category: 'Sewa Toko', amount: 1200000, note: 'Bulan November', account: 'Bank BCA' },
      { id: 'FIN-003', date: '2026-11-12', type: 'Pemasukan', category: 'Pelunasan Invoice #102', amount: 2100000, note: 'Toko Berkah', account: 'Bank BCA' },
    ]);
  }

  if (!localStorage.getItem('tk_sales')) {
    setStore('tk_sales', [
      { id: 'SO-101', customer: 'Budi Santoso', date: '2026-11-12', total: 1450000, status: 'Quotation', salesPerson: 'Kasir 1' },
      { id: 'SO-102', customer: 'CV Maju Jaya', date: '2026-11-13', total: 4200000, status: 'Confirmed', salesPerson: 'Admin' },
      { id: 'SO-103', customer: 'Siti Rahma', date: '2026-11-13', total: 850000, status: 'Done', salesPerson: 'Kasir 2' },
    ]);
  }

  if (!localStorage.getItem('tk_website')) {
    setStore('tk_website', {
      heroTitle: 'Toko Kita — Grosir & Eceran Terpercaya',
      heroSubtitle: 'Menyediakan kebutuhan harian terbaik dengan harga terjangkau.',
      bannerUrl: '',
      contactPhone: '081234567890',
      isOnlineStoreActive: true,
      featuredCategory: 'Makanan & Minuman'
    });
  }

  if (!localStorage.getItem('tk_scm')) {
    setStore('tk_scm', [
      { id: 'PO-01', supplier: 'PT Indofood Sukses', item: 'Minstan Goreng 1 Karton', qty: 25, unitPrice: 110000, status: 'Shipping', eta: '2026-11-15' },
      { id: 'PO-02', supplier: 'CV Sembako Jaya', item: 'Minyak Goreng 2L', qty: 40, unitPrice: 32000, status: 'Received', eta: '2026-11-11' },
    ]);
  }

  if (!localStorage.getItem('tk_hr')) {
    setStore('tk_hr', [
      { id: 'EMP-01', name: 'Ahmad Fauzi', role: 'Kasir', department: 'Operasional', salary: 3500000, status: 'Aktif' },
      { id: 'EMP-02', name: 'Dewi Lestari', role: 'Staff Gudang', department: 'Supply Chain', salary: 3300000, status: 'Aktif' },
      { id: 'EMP-03', name: 'Rian Hidayat', role: 'Sales Field', department: 'Pemasaran', salary: 3800000, status: 'Aktif' },
    ]);
  }

  if (!localStorage.getItem('tk_marketing')) {
    setStore('tk_marketing', [
      { id: 'CAM-01', name: 'Promo Akhir Tahun', channel: 'WhatsApp Broadcast', budget: 150000, status: 'Aktif', leadCount: 42 },
      { id: 'CAM-02', name: 'Diskon Member Baru', channel: 'Voucher Fisik', budget: 300000, status: 'Selesai', leadCount: 88 },
    ]);
  }
};
