const fs = require('fs');
export default function handler(req, res) {
  const { product } = req.body; // クライアントから送られたProductデータ

  // db.jsonに新しいProductデータを追加する
  const dbPath = './path/to/db.json';
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  dbData.products.push(product);

  // db.jsonを更新する
  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));

  res.status(200).json({ message: 'Product data saved successfully' });
}