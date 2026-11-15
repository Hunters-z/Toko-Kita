// Data layer Toko Kita: localStorage (ringan, tanpa setup), adapter GAS/Supabase opsional.
const KEY = 'toko_kita_db_v1'
const seed = {
  products: [
    { id:'p1', name:'Kopi Arabika 250g', emoji:'☕', price:85000, stock:24, minStock:5, discount:0 },
    { id:'p2', name:'Teh Melati 100g', emoji:'🍵', price:45000, stock:18, minStock:5, discount:0 },
    { id:'p3', name:'Cokelat Timur', emoji:'🍫', price:32000, stock:3, minStock:5, discount:10 },
    { id:'p4', name:'Kacang Garing', emoji:'🥜', price:18000, stock:40, minStock:10, discount:0 },
    { id:'p5', name:'Beras Premium 5kg', emoji:'🍚', price:68000, stock:12, minStock:4, discount:0 },
    { id:'p6', name:'Minyak Goreng 1L', emoji:'🛢️', price:24000, stock:30, minStock:8, discount:0 },
  ],
  customers: [
    { id:'c1', name:'Budi Santoso', phone:'0812-1111-2222', note:'Pelanggan langganan' },
    { id:'c2', name:'PT Maju Jaya', phone:'021-555-0101', note:'Korporat' },
    { id:'c3', name:'Toko Sinar', phone:'0813-3333-4444', note:'' },
  ],
  invoices: [], txs: [], employees: [
    { id:'e1', name:'Rina Kasir', role:'Kasir', pin:'1234', credId:null },
    { id:'e2', name:'Doni Gudang', role:'Gudang', pin:'2345', credId:null },
  ],
  attendance: [], suppliers: [], expenses: [],
  purchases: [], bundles: [], payments: [],
  settings: { ppn: 0, ppnOn: false, shopName: 'Toko Kita', officeLat: null, officeLng: null, officeRadius: 100, shiftStart: '08:00' },
}

export function loadDB() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return migrate(structuredClone(seed))
    const db = JSON.parse(raw)
    return migrate(db)
  } catch { return migrate(structuredClone(seed)) }
}

function migrate(db) {
  // Pastikan semua field wajib hadir
  for (const k of ['purchases','bundles','payments','suppliers','expenses','invoices','txs','attendance']) {
    if (!Array.isArray(db[k])) db[k] = []
  }
  if (!db.settings) db.settings = structuredClone(seed.settings)
  else {
    for (const k of ['ppn','ppnOn','shopName','officeLat','officeLng','officeRadius','shiftStart']) {
      if (db.settings[k] === undefined) db.settings[k] = seed.settings[k]
    }
  }
  db.products?.forEach(p => {
    if (p.discount == null) p.discount = 0
    if (p.minStock == null) p.minStock = 5
  })
  return db
}

export function saveDB(db) { localStorage.setItem(KEY, JSON.stringify(db)) }
export function resetDB() { localStorage.removeItem(KEY) }
export const rp = n => 'Rp ' + Math.round(n ?? 0).toLocaleString('id-ID')
export const effPrice = p => Math.round(p.price * (1 - (p.discount||0)/100))
export const uid = pre => pre + Date.now().toString(36) + Math.random().toString(36).slice(2,6)