const AWS = require('aws-sdk');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKey = process.env.R2_ACCESS_KEY;
const r2SecretKey = process.env.R2_SECRET_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME;
const r2PublicUrl = process.env.R2_PUBLIC_URL;

const s3 = new AWS.S3({
        endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
        accessKeyId: r2AccessKey,
        secretAccessKey:r2SecretKey,
        region: 'auto',
        signatureVersion: 'v4',
});

const uploadToR2 = async (type, file) => {
        let addPath = '';
        let buffer = '';
        if(type === 'H') { // History
                addPath = 'history';
                buffer = fs.readFileSync(file);
        } else if(type === 'F') { // Fearless
                addPath = 'fearless';
                buffer = fs.readFileSync(file);
        } else if(type === 'S') { // shuffle
                addPath = 'shuffle';
                buffer = file;
        }
        const fileName = `${addPath}/${uuidv4()}.png`;

        const params = {
                Bucket: r2BucketName,
                Key: fileName,
                Body: buffer,
                ContentType: 'image/png',
                ACL: 'public-read', 
        };

        await s3.putObject(params).promise();

        const url = `https://${r2PublicUrl}/${fileName}`;
        return url;
}

module.exports = { uploadToR2 };