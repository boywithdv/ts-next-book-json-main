const process = require("process");
const jsonServer = require('json-server');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const express = require('express');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const port = process.env.PORT || 8000;
const axios = require('axios');
const cheerio = require('cheerio');
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
  if (
    !(req.body['username'] === 'user' && req.body['password'] === 'password')
  ) {
    return res.status(401).json({
      message: 'Username or password are incorrect',
    });
  }

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
      message: 'Unauthorized',
    });
  }

  res.status(201).json({
    message: 'ok',
  });
});

server.get('/users/me', (req, res) => {
  if (req.cookies['token'] !== 'dummy_token') {
    return res.status(401).json({
      message: 'Unauthorized',
    });
  }

  res.status(200).json(authUser);
});

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
const app = express();

app.get('/api/proxy', async (req, res) => {
  try {
    const html = await axios.get('https://ts-next-book-json-main.vercel.app/'); // HTMLデータを取得

    // Cheerioを使用してHTMLデータを解析し、必要な情報を抽出
    const $ = cheerio.load(html.data);
    const title = $('title').text();

    // 必要な情報をJSON形式に整形
    const jsonData = { title };

    res.json(jsonData); // JSONデータをクライアントに返す
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});