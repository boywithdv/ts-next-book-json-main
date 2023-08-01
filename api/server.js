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
server.post('/auth/signin', (req, res) => {
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
server.post('/auth/signout', (req, res) => {
  res.cookie('token', '', {
    maxAge: 0,
    httpOnly: true,
  });
  res.status(200).json({
    message: 'Sign out successfully',
  });
});
server.post('/purchases', (req, res) => {
  if (req.cookies['token'] !== 'dummy_token') {
    return res.status(401).json({
      message: '再度ログインを行ってください',
    });
  }
  res.status(201).json({
    message: 'ok',
  });
});
server.get('/users/me', (req, res) => {
  if (req.cookies['token'] !== 'dummy_token') {
    return res.status(401).json({
      message: 'Unauthorized /users/me',
    });
  }
  res.status(200).json(authUser);
});

//アップロードしたファイルを保存するディレクトリ
const uploadDirectory = path.join(__dirname, "upload");
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}
//Multerの設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}
const upload = multer({ storage });

//ファイルのアップロードを処理するエンドポイント
server.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  //保存したファイルのパスを公開URLにする
  const publicUrl = `/upload/${req.file.filename}.png`;
  console.log('これがファイルのURLです : ',`${publicUrl}`)
  res.json({ url: `${publicUrl}` });
})

server.use(middlewares);
server.use(router);
server.listen(port, (err) => {
  if (err) {
    console.error(err);
    process.exit();
  }
  console.log("Start listening...");
  console.log('http://localhost:' + port);
});