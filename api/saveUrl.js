import aws from 'aws-sdk'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit')

export default async function handler(req, res) {
  //リクエストのクエリパラメータからtitle（PDF内のテキストの内容）とfilename（PDFファイルの名前）を取得します。
  const { query: { title, filename } } = req
  console.log('これが saveUrl.jsファイルである', req)
  //PDFDocumentクラスのインスタンスを作成します。
  //テキスト（title）をPDFに追加します。
  //PDFの生成を終了します（doc.end()）。
  const doc = new PDFDocument()
  //PDFを一時的なフォルダ（/tmp）に書き込むためのWriteStreamを作成します。
  //doc.pipe(writeStream)でPDFの内容をWriteStreamにパイプします
  let writeStream = fs.createWriteStream(`/tmp/${filename}.pdf`)
  doc.pipe(writeStream)
  doc.text(title)
  doc.end()
  //PDFの生成が終了すると（finishイベント）、writeStreamが閉じられ、ファイル書き込みが完了します。
  writeStream.on('finish', function () {
    //ファイルの書き込みが完了した後、fs.readFileSyncを使って書き込まれたPDFファイルを読み込みます。
    const fileContent = fs.readFileSync(`/tmp/${filename}.pdf`)
    //AWS S3へアップロードするためのパラメータを作成します。
    var params = {
      Key: `${filename}.pdf`,
      Body: fileContent,
      Bucket: 'your-s3-bucket-name',
      ContentType: 'application/pdf',
    }
    console.log('this is params saveUrl.js', params.Body)
    //AWS S3のインスタンスを作成し、アクセスキーとシークレットアクセスキーを環境変数から取得して設定します。
    const s3 = new aws.S3({
      accessKeyId: 'AKIAUPPJEECP2SYBAGML',
      secretAccessKey: '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',
    })
    // s3.putObjectを使用して、PDFファイルをAWS S3バケットにアップロードします。
    s3.putObject(params, function (err, response) {
      // アップロードが成功した場合は、res.status(200).json({ response: File ${filename} saved to S3 })を使って成功メッセージを返します。
      res.status(200).json({ response: `File ${filename} saved to S3` })
    })
  })
}
