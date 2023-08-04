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
const PDFDocument = require('pdfkit')
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

// PDFを一時的なフォルダ（/tmp）に書き込むためのWriteStreamを作成する関数
const createPDF = (title, filename) => {
  const doc = new PDFDocument();
  let writeStream = fs.createWriteStream(`/tmp/${filename}.pdf`);
  doc.pipe(writeStream);
  doc.text(title);
  doc.end();
  return writeStream;
};

// PDFをS3にアップロードする関数
const uploadToS3 = (filename) => {
  const fileContent = fs.readFileSync(`/tmp/${filename}.pdf`);
  const params = {
    Key: `${filename}.pdf`,
    Body: fileContent,
    Bucket: 'your-s3-bucket-name',
    ContentType: 'application/pdf',
  };
  const s3 = new aws.S3({
    accessKeyId: "AKIAUPPJEECP2SYBAGML",
    secretAccessKey: 'jmWz+FCGEX+zs9BWw4FruE/81bHkKUiIMVZfCHsW',
  });
  return new Promise((resolve, reject) => {
    s3.putObject(params, function (err, response) {
      if (err) {
        console.error('Failed to upload file to S3:', err);
        reject(err);
      } else {
        // remove the temporary file after successful upload
        fs.unlinkSync(`/tmp/${filename}.pdf`);
        resolve(response);
      }
    });
  });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

server.post('/api/proxy/products', upload.single('file'), async (req, res) => {
  const { title, filename } = req.body.imageUrl;
  try {
    // 一時的なPDFファイルを作成
    const writeStream = createPDF(title, filename);
    writeStream.on('finish', async function () {
      // PDFファイルをS3にアップロード
      await uploadToS3(filename);
      console.log('console.log(filename) *', filename)
      res.status(200).json({ message: `File ${filename} saved to S3` });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to save file' });
  }
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