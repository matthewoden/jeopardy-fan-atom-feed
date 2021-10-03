const AWS = require('aws-sdk')

const s3 = new AWS.S3()

const putString = (string) => {
  return s3.putObject({
    Bucket: 'the-jeopardy-fan',
    Key: 'feed.atom',
    ACL: 'public-read',
    ContentType:'application/atom+xml',
    Body: Buffer.from(string, 'binary')
  }).promise();
}

module.exports = putString
