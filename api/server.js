const process = require("process");
const jsonServer = require('json-server');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const port = process.env.PORT || 8000;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const aws = require('aws-sdk')
server.use(cors({
  origin: true,
  credentials: true,
}));
const authUser = {
  id: '1',
  username: 'taketo',
  displayName: 'Taketo Yoshida',
  email: 'taketo@example.com',
  profileImageUrl: '/users/1.png',
  description:
    'Lorem Ipsum is simply dummy text of the printing and typesetting industry',
};
server.use(cookieParser());
server.use(express.json());
server.post('/api/proxy/auth/signin', (req, res) => {
  if (!(req.body['username'] === 'user' && req.body['password'] === 'password')) {
    return res.status(401).json({message: 'Username or password are incorrect',
    });
  }
  //tokenの設定を行う
  res.cookie('token', 'dummy_token', {
    maxAge: 3600 * 1000,
    httpOnly: true,
  });
  res.status(201).json(authUser);
});
server.post('/api/proxy/auth/signout', (req, res) => {
  res.cookie('token', '', {
    maxAge: 0,
    httpOnly: true,
  });
  res.status(200).json({
    message: 'Sign out successfully',
  });
});
server.post('/api/proxy/purchases', (req, res) => {
  if (req.cookies['token'] !== 'dummy_token') {
    return res.status(401).json({
      message: '再度ログインを行ってください',
    });
  }
  res.status(201).json({
    message: 'ok',
  });
});
//初期画面描画時に実行される
//errorStates が404になる理由がある
// errorBodyにmessageが本来はいるが入っていない ===> if文が実行されていない
//users/meに対してのget request
server.get('/api/proxy/users/me', (req, res) => {
  if (req.cookies['token'] !== 'dummy_token') {
    return res.status(401).json({
      message: 'Unauthorized /users/me',
    });
  }
  res.status(200).json(authUser);
});
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
    console.log("これがアップロード ; ",req.body)
  },
  filename: (req, file, cb) => {
    console.log("これがローディング : ",req.body)
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
//ここから追加(sotrage定数追加)
const upload = multer({ storage });
//ファイルのアップロードを処理するエンドポイント
//エンドポイントが違うことでアップロードできる
/**
 * クライアント /products
 * サーバー　/product
 */
server.post('/api/proxy/products', upload.single('file'), (req, res) => {
  console.log("111これが req.body : ",req.body)

  //保存したファイルのパスを公開URLにする /upload/${req.file.filename}.png
  const publicUrl = `${req.body.imageUrl}`;
  console.log('これがファイルのURLです : ', `${publicUrl}`)
  res.status(200).json(req.body)
  //res.status(200).json({url : publicUrl});
  //res.json({ url: `${publicUrl}` });
})
server.use(middlewares);
server.use(router);
server.listen(port, (err) => {
  if (err) {
    console.error(err);
    process.exit();
    return;
  }
  console.log("Start listening...");
  console.log('http://localhost:' + port);
});