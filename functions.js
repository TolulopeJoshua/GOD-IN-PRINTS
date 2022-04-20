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
            Key: key 
        }
      
    ).promise();
    return data;
}

  module.exports.putImage = async (key, body) => {
    //   console.log(key);
      const data =  s3.putObject(
          {
              Bucket: `godinprintsdocuments`,
              Key: key,
              Body: body,
          }
        
      ).promise();
      return data;
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

