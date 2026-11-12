// Helper stok: dipakai Dashboard, Sheet bel Layout, dan POS agar definisi konsisten.
// menipis = stock <= minStock && stock > 0 ; habis = stock === 0
export function getLowStock(products = []) {
  return products.filter(p => p.stock <= p.minStock && p.stock > 0)
}
export function getOutOfStock(products = []) {
  return products.filter(p => p.stock === 0)
}
