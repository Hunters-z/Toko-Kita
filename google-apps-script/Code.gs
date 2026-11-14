/**
 * TOKO KITA — Backend Google Apps Script (Multi-HTML / Separate Pages Support)
 * ==================================================================
 * Routing berdasarkan URL parameter `page`:
 *   - /exec?page=admin  -> Admin.html (Ringkasan, Modul ERP, Transaksi)
 *   - /exec?page=pos    -> Pos.html   (Panel Kasir & POS)
 *   - /exec?page=absen  -> Absen.html (Menu Absensi, Izin, Slip Gaji Karyawan)
 *   - /exec (tanpa page)-> Index.html (Halaman Utama / Landing Router)
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
  Marketing: ['id','name','channel','budget','status','leadCount'],
  Website:   ['id','title','subtitle','status']
}

function doGet(e) {
  // 1. Check multi-page UI rendering
  const page = (e && e.parameter && e.parameter.page) ? e.parameter.page.toLowerCase() : '';
  
  if (page === 'admin') {
    return HtmlService.createHtmlOutputFromFile('Admin')
      .setTitle('Toko Kita — Panel Admin')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  if (page === 'pos') {
    return HtmlService.createHtmlOutputFromFile('Pos')
      .setTitle('Toko Kita — Panel Kasir (POS)')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  if (page === 'cms') {
    return HtmlService.createHtmlOutputFromFile('CMS')
      .setTitle('Toko Kita — CMS & Website')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  if (page === 'inventori' || page === 'inventory') {
    return HtmlService.createHtmlOutputFromFile('Inventori')
      .setTitle('Toko Kita — Inventori Produk')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
    return HtmlService.createHtmlOutputFromFile('Absen')
      .setTitle('Toko Kita — Absensi & Portal Karyawan')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  if (page === 'ui' || page === 'index') {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Toko Kita — Portal ERP')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // 2. Default JSON API endpoint handling
  const action = (e && e.parameter && e.parameter.action ? e.parameter.action : 'all').toLowerCase();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets_(ss);

  if (action === 'all') {
    const out = {};
    for (const name of Object.keys(SHEETS)) out[name.toLowerCase()] = readSheet_(ss, name);
    return json_(out);
  }
  if (action === 'ping') return json_({ ok: true, app: 'Toko Kita', time: new Date().toISOString() });
  if (SHEETS[action.charAt(0).toUpperCase()+action.slice(1)]) {
    const key = action.charAt(0).toUpperCase()+action.slice(1);
    return json_({ [action]: readSheet_(ss, key) });
  }
  
  // Return Index UI by default if no API action specified
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Toko Kita — Portal ERP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets_(ss);
  let body = {};
  try { body = JSON.parse(e.postData.contents) } catch { return json_({ error: 'bad json' }, 400) }
  const { table, row } = body;
  if (!table || !row) return json_({ error: 'butuh table & row' }, 400);
  const key = table.charAt(0).toUpperCase() + table.slice(1);
  if (!SHEETS[key]) return json_({ error: 'table tidak dikenal: ' + table }, 400);
  appendRow_(ss, key, row);
  return json_({ ok: true, table, id: row.id });
}

/** util */
function ensureSheets_(ss) {
  for (const [name, cols] of Object.entries(SHEETS)) {
    let sh = ss.getSheetByName(name);
    if (!sh) { sh = ss.insertSheet(name); sh.getRange(1,1,1,cols.length).setValues([cols]).setFontWeight('bold') }
  }
}
function readSheet_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) return [];
  const vals = sh.getDataRange().getValues();
  if (vals.length < 2) return [];
  const head = vals[0];
  return vals.slice(1).filter(r=>r[0]).map(r => {
    const o = {};
    head.forEach((h,i) => {
      let v = r[i];
      if (v instanceof Date) v = v.toISOString();
      o[h] = v;
    });
    return o;
  });
}
function appendRow_(ss, name, row) {
  const cols = SHEETS[name];
  const sh = ss.getSheetByName(name);
  sh.appendRow(cols.map(c => {
    const v = row[c];
    return (v !== undefined && v !== null) ? (typeof v === 'object' ? JSON.stringify(v) : v) : '';
  }));
}
function json_(obj, code) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
