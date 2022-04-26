const fs = require('fs');
const aws = require('aws-sdk'),
      bodyParser = require('body-parser'),
      multer = require('multer'),
      multerS3 = require('multer-s3');


aws.config.update({
    secretAccessKey: process.env.AWSSecretKey,
    accessKeyId: process.env.AWSAccessKeyId,
    region: 'eu-west-3'
});

const s3 = new aws.S3(); 

module.exports.getImage = async (key) => {
    const data =  s3.getObject(
        {
            Bucket: `godinprintsdocuments`,
            Key: key, 
        }
      
    ).promise();
    return data;
}

const putImage = async (key, body) => {
      const data =  s3.putObject(
          {
              Bucket: `godinprintsdocuments`,
              Key: key,
              Body: body,
          }
      ).promise();
      return data;
}
module.exports.putImage = putImage;

module.exports.uploadCompressedImage = async (imgPath, key) => {
    var Jimp = require('jimp');
    const path = require('path');
    const image = await Jimp.read(imgPath);
    await image.resize(640, Jimp.AUTO);
    await image.quality(20);
    await image.writeAsync('output.jpg');
    const myBuffer = await fs.readFileSync('output.jpg');
    await putImage(key, myBuffer);
    let files = await fs.readdirSync('uploads')
    for (const file of files) {
      fs.unlinkSync(path.join('uploads', file));
    }
}

module.exports.encode = (data) => {
      let buf = Buffer.from(data);
      let base64 = buf.toString('base64');
      return base64
  }
 
module.exports.s3 = new aws.S3(); 

module.exports.upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'godinprintsdocuments',
        key: function (req, file, cb) {
            console.log(req.file);
            cb(null, 'book/' + Date.now().toString() + '_' + file.originalname); //use Date.now() for unique file keys
        },
    })
});

module.exports.upload0 = multer({ storage: multer.diskStorage({
        destination: function (req, file, cb) {
        cb(null, './uploads')
        },
        filename: function (req, file, cb) {
        cb(null, file.originalname)
        },
    })
});

module.exports.paginate = (req, docs) => {

    let page = Number(req.query.page) || 1; let toSkip = (page - 1) * 10;
    const pageDocs = docs.splice(toSkip, 10)

    const pageData = {};
    pageData.previous = page === 1 ? false : true;  
    pageData.next = page < (docs.length / 10 + 1) ? true : false;
    pageData.page = page;
    pageData.pages = [page];
    pageData.previous && pageData.pages.unshift(Number(page) - 1);
    pageData.next && pageData.pages.push(Number(page) + 1);
    pageData.queryString = '?';
    for (const q in req.query) {
        q !== 'page' && (pageData.queryString += q.replaceAll('%20', ' ') + '=' + req.query[q] + '&');
    }
    pageData.search = req.query.search;
    return [pageDocs, pageData];
}