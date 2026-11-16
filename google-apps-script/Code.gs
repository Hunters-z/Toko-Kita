/**
 * TOKO KITA — Backend Google Apps Script (Sinkronisasi Vercel & Light UI)
 * ==================================================================
 * Routing berdasarkan URL parameter `page`:
 *   - /exec?page=admin     -> Admin.html (Dasbor & Ringkasan)
 *   - /exec?page=pos       -> Pos.html   (Panel Kasir & POS)
 *   - /exec?page=absen     -> Absen.html (Portal Karyawan & Selfie Attendance)
 *   - /exec?page=inventori -> Inventori.html (Kelola Produk & Stok)
 *   - /exec?page=cms       -> CMS.html (Pengaturan Website & CMS)
 *   - /exec?page=store     -> Storefront.html (Toko Online Pelanggan)
 *   - /exec (tanpa param)  -> Index.html (Halaman Utama / Landing Router)
 *   - /exec?action=all     -> JSON Data Dump (semua sheet)
 */

const SHEETS = {
  produk:      ['id','name','emoji','price','stock','minStock','discount'],
  transaksi:   ['id','date','items','sub','disc','tax','total','method'],
  pelanggan:   ['id','name','phone','note'],
  invoice:     ['id','customerId','date','due','total','status'],
  pegawai:     ['id','name','role','pin'],
  absen:       ['id','employeeId','name','in','out','status','latIn','lngIn','distIn','photoIn','photoOut'],
  pemasok:     ['id','name','phone','item'],
  pengeluaran:  ['id','date','category','note','amount'],
  pembelian:   ['id','supplierId','date','items','total','status'],
  izin:        ['id','employeeId','tanggal','jenis','status'],
  gaji:        ['id','employeeId','bulan','jumlah'],
  website:     ['id','title','subtitle','status'],
  opname:      ['id','date','productId','productName','systemStock','physicalStock','diff','status']
};

const TABLES_FOR_POST = Object.keys(SHEETS);

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const page = (params.page || 'index').toLowerCase();
    const action = params.action || '';

    if (action === 'ping') return json_({ ok: true, app: 'Toko Kita', time: new Date().toISOString() });
    if (action === 'all') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      ensureSheets_(ss);
      const out = {};
      for (const key of Object.keys(SHEETS)) out[key] = readSheet_(ss, key);
      return json_(out);
    }
    if (TABLES_FOR_POST.includes(action)) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      ensureSheets_(ss);
      return json_({ [action]: readSheet_(ss, action) });
    }

    const map = {
      admin: 'Admin',
      pos: 'Pos',
      absen: 'Absen',
      inventori: 'Inventori',
      cms: 'CMS',
      store: 'Storefront',
      opname: 'Opname',
      index: 'Index'
    };

    const fileName = map[page] || 'Index';
    
    return HtmlService.createHtmlOutputFromFile(fileName)
      .setTitle('Toko Kita — ' + page.toUpperCase())
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
      
  } catch (err) {
    return HtmlService.createHtmlOutput('<h3>Error:</h3><pre>' + err.message + '</pre>');
  }
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets_(ss);
  
  let body = {};
  try { body = JSON.parse(e.postData.contents) } catch(err) {
    return json_({ error: 'Invalid JSON', raw: e.postData?.contents }, 400);
  }
  
  const { table, row } = body;
  if (!table || !row) return json_({ error: 'Missing table or row field' }, 400);
  if (!TABLES_FOR_POST.includes(table)) return json_({ error: 'Unknown table: ' + table }, 400);
  
  appendRow_(ss, table, row);
  return json_({ ok: true, table, id: row.id });
}

// Fungsi all() untuk dipanggil via google.script.run.all()
function all() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheets_(ss);
  const out = {};
  for (const key of Object.keys(SHEETS)) out[key] = readSheet_(ss, key);
  return out;
}

// ---- Helpers ----

function ensureSheets_(ss) {
  for (const [name, cols] of Object.entries(SHEETS)) {
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
    }
  }
}

function readSheet_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  const vals = sh.getDataRange().getValues();
  const head = vals[0];
  return vals.slice(1).filter(r => r[0]).map(r => {
    const o = {};
    head.forEach((h, i) => {
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
    if (v === undefined || v === null) return '';
    return typeof v === 'object' ? JSON.stringify(v) : v;
  }));
}

function json_(obj, code) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}