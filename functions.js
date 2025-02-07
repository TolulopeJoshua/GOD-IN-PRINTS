const fs = require('fs');
const aws = require('aws-sdk'),
      bodyParser = require('body-parser'),
      multer = require('multer'),
      multerS3 = require('multer-s3');


aws.config.update({
    secretAccessKey: process.env.AWSSecretKey,
    accessKeyId: process.env.AWSAccessKeyId,
    region: 'us-east-1'
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

module.exports.deleteImage = async (key) => {
    const data =  s3.deleteObject(
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
    const image = await Jimp.read(imgPath);
    image.resize(640, Jimp.AUTO);
    image.quality(20);
    await image.writeAsync('output.jpg');
    const myBuffer = fs.readFileSync('output.jpg');
    await putImage(key, myBuffer);
    fs.unlinkSync(imgPath);
}

module.exports.encode = (data) => {
      let buf = Buffer.from(data);
      let base64 = buf.toString('base64');
      return base64
  }
 
module.exports.s3 = new aws.S3(); 

function checkFileType(file, cb){
    const path = require('path');
    // Allowed ext
    const filetypes = /pdf|mobi|epub|docx/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);
  
    if(mimetype && extname){
        return cb(null,true);
    } else {
        return cb(new Error('Allowed extensions - PDF | MOBI | EPUB | DOCX'));
    }
  }
  module.exports.checkFileType = checkFileType;

module.exports.upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'godinprintsdocuments',
        key: function (req, file, cb) {
            cb(null, 'book/' + Date.now().toString() + '_' + file.originalname); //use Date.now() for unique file keys
        },
    }),
    fileFilter: function(_req, file, cb){
        checkFileType(file, cb);
    }
});

module.exports.upload0 = multer({ 
    storage: multer.diskStorage({
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
        q !== 'page' && (pageData.queryString += q.replace(/%20/g, ' ') + '=' + req.query[q] + '&');
    }
    pageData.search = req.query.search;
    return [pageDocs, pageData];
}
 
let nodeMailer = require('nodemailer');
module.exports.transporter = nodeMailer.createTransport({
  host: "smtp.gmail.com", // hostname
  port: 465, // port for secure SMTP
  secure: true, // TLS requires secureConnection to be false
  auth: {
      user: 'godinprintslibraries@gmail.com',
      pass: process.env.GMAIL_PASSWORD
  },
});

module.exports.transporter2 = nodeMailer.createTransport({
    SES: new aws.SES({
        apiVersion: '2010-12-01'
      }),
  });
