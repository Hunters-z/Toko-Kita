/**
 * TOKO KITA — Backend Google Apps Script (opsional, alternatif tanpa Vercel/Supabase)
 * ==================================================================
 * Instalasi (SEKALI, ±5 menit):
 * 1. Buka https://sheets.new → beri nama "Toko Kita DB"
 * 2. Menu Ekstensi → Apps Script → hapus isi, tempel file ini
 * 3. Deploy → Deployment baru → jenis: Aplikasi web
 *    - Execute as: Me · Who has access: Anyone
 *    - Deploy → salin URL Web App (…/exec)
 * 4. Di Toko Kita (Vercel) → Pengaturan → "Sinkron Google Sheets" → tempel URL
 *    (atau jalankan index.html versi GAS — lihat catatan di bawah)
 *
 * Yang didapat: database Google Sheets otomatis (sheet: Produk, Transaksi,
 * Pelanggan, Invoice, Pegawai, Absen, Pemasok, Pengeluaran, Pembelian)
 * + API JSON utk app + halaman dashboard web bawaan (lihat Index.html).
 * Untuk menyajikan halaman web: di Code.gs tambahkan di awal doGet(e):
 *   if (e && e.parameter.page === 'ui') return HtmlService.createHtmlOutputFromFile('Index')
 *     .setTitle('Toko Kita').addMetaTag('viewport','width=device-width, initial-scale=1')
 * lalu akses URL /exec?page=ui — API JSON tetap berjalan seperti biasa.
 */

const SHEETS = {
  Produk:    ['id','name','emoji','price','stock','minStock','discount'],
  Transaksi: ['id','date','items','sub','disc','tax','total','method'],
  Pelanggan: ['id','name','phone','note'],
  Invoice:   ['id','customerId','date','due','total','status'],
  Pegawai:   ['id','name','role','pin'],
  Absen:     ['id','employeeId','name','in','out'],
  Pemasok:   ['id','name','phone','item'],
  Pengeluaran:['id','date','category','note','amount'],
  Pembelian: ['id','supplierId','date','items','total','status'],
  Izin:      ['id','employeeId','tanggal','jenis','status'],
  Gaji:      ['id','employeeId','bulan','jumlah'],
  Finance:   ['id','date','type','category','amount','note'],
  Sales:     ['id','customer','date','total','status','salesPerson'],
  Scm:       ['id','supplier','item','qty','status','eta'],
  Marketing: ['id','name','channel','budget','status','leadCount']
}

function doGet(e) {
  const action = (e.parameter.action || 'all').toLowerCase()
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  ensureSheets_(ss)
  if (action === 'all') {
    const out = {}
    for (const name of Object.keys(SHEETS)) out[name.toLowerCase()] = readSheet_(ss, name)
    return json_(out)
  }
  if (action === 'ping') return json_({ ok: true, app: 'Toko Kita', time: new Date().toISOString() })
  if (SHEETS[action.charAt(0).toUpperCase()+action.slice(1)]) {
    const key = action.charAt(0).toUpperCase()+action.slice(1)
    return json_({ [action]: readSheet_(ss, key) })
  }
  return json_({ error: 'unknown action' }, 400)
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  ensureSheets_(ss)
  let body = {}
  try { body = JSON.parse(e.postData.contents) } catch { return json_({ error: 'bad json' }, 400) }
  const { table, row } = body
  if (!table || !row) return json_({ error: 'butuh table & row' }, 400)
  const key = table.charAt(0).toUpperCase() + table.slice(1)
  if (!SHEETS[key]) return json_({ error: 'table tidak dikenal: ' + table }, 400)
  appendRow_(ss, key, row)
  return json_({ ok: true, table, id: row.id })
}

/** util */
function ensureSheets_(ss) {
  for (const [name, cols] of Object.entries(SHEETS)) {
    let sh = ss.getSheetByName(name)
    if (!sh) { sh = ss.insertSheet(name); sh.getRange(1,1,1,cols.length).setValues([cols]).setFontWeight('bold') }
  }
}
function readSheet_(ss, name) {
  const sh = ss.getSheetByName(name)
  const vals = sh.getDataRange().getValues()
  if (vals.length < 2) return []
  const head = vals[0]
  return vals.slice(1).filter(r=>r[0]).map(r => {
    const o = {}
    head.forEach((h,i) => {
      let v = r[i]
      if (v instanceof Date) v = v.toISOString()
      o[h] = v
    })
    return o
  })
}
function appendRow_(ss, name, row) {
  const cols = SHEETS[name]
  const sh = ss.getSheetByName(name)
  sh.appendRow(cols.map(c => {
    const v = row[c]
    return (v !== undefined && v !== null) ? (typeof v === 'object' ? JSON.stringify(v) : v) : ''
  }))
}
function json_(obj, code) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}
