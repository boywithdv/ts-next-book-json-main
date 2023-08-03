// api/addProduct.js

const fs = require('fs');
const path = require('path');

const dbFilePath = path.join(__dirname, '../db.json');

module.exports = (req, res) => {
  if (req.method === 'POST') {
    // POSTリクエストのボディから新しい商品データを取得
    const newProduct = req.body;

    // db.jsonファイルを読み込み
    fs.readFile(dbFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading db.json:', err);
        return res.status(500).json({ error: 'Failed to read database.' });
      }

      try {
        // 現在のデータをJSONオブジェクトにパース
        const currentData = JSON.parse(data);

        // 新しい商品データを追加
        currentData.products.push(newProduct);

        // 更新されたデータをdb.jsonに書き込む
        fs.writeFile(dbFilePath, JSON.stringify(currentData, null, 2), (err) => {
          if (err) {
            console.error('Error writing db.json:', err);
            return res.status(500).json({ error: 'Failed to write to database.' });
          }

          // 成功した場合は更新後のデータを返す
          return res.status(200).json({ success: true, data: currentData.products });
        });
      } catch (err) {
        console.error('Error parsing db.json:', err);
        return res.status(500).json({ error: 'Failed to parse database.' });
      }
    });
  } else {
    return res.status(405).json({ error: 'Method not allowed.' });
  }
};
