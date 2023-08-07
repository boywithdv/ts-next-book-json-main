//サーバーレス関数を作成する


const low = require('lowdb');
const MemoryAdapter = require('lowdb/adapters/Memory');
const adapter = new MemoryAdapter();
const db = low(adapter);

// 初期データのセットアップ（必要に応じて変更）
db.defaults({ products: [] }).write();

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const products = db.get('products').value();
    res.status(200).json(products);
  } else if (req.method === 'POST') {
    const newProduct = req.body;
    db.get('products').push(newProduct).write();
    res.status(201).json(newProduct);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};