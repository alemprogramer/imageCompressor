require('dotenv').config()
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const AWS = require('aws-sdk');
const morgan = require('morgan');
const app = express();
const port = 4000; // Use any desired port number
const sharp = require('sharp');
console.log('log',process.env.AWS_ACCESS_KEY_ID);

app.use(morgan('dev'))
const bucket= process.env.AWS_BUCKET
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
  });

const s3 = new AWS.S3();

app.use(express.json());

app.get('/list', async (req, res) => {
    
        try {
          const response = await s3.listObjects(
            { 
             Bucket:process.env.AWS_BUCKET,
            //  MaxKeys:122,
            //  Marker:'production/storage/product/2022-12-10-63948431f0dac.png'
             Prefix: 'test/'  
            }).promise();
          let arr = response.Contents
          for(let i = 0; i < arr.length; i++){
              let imageKey = arr[i].Key;
              let isImage = arr[i].Key.split('.')
              console.log('up',isImage[isImage.length - 1]);
              if(isImage[isImage.length - 1] != 'png' ) continue 
              console.log('here',isImage[isImage.length - 1]);
              const downloadResponse = await s3.getObject({Bucket:bucket,Key:imageKey}).promise();
              const originalImageData = downloadResponse.Body;

              const compressedImageData = await sharp(originalImageData).jpeg({ quality: 70 }).toBuffer();
              let params = {
                Bucket: process.env.AWS_BUCKET,
                Key: `${imageKey}`,
                Body: compressedImageData,
            }
    
            s3.upload(params, (error, data) => {
                    console.log(data);
    
            })
          }

        res.send(response.Contents)
          
        } catch (error) {
          console.error('Error:', error);
          res.send(error);
        }

});


const imageKey = 'production/storage/return_request_products/2023-08-28-64ecbce68f58c.png';

app.get('/compress',async (req,res)=>{
    let  options = {
        Bucket    : process.env.AWS_BUCKET,  //TODO: add env
        Key    : imageKey,
    };

    try {
        const downloadResponse = await s3.getObject(options).promise();
        const originalImageData = downloadResponse.Body;
        
        const compressedImageData = await sharp(originalImageData).jpeg({ quality: 70 }).toBuffer();

        let params = {
            Bucket: process.env.AWS_BUCKET,
            Key: `test/${imageKey}`,
            Body: originalImageData,
        }

        s3.upload(params, (error, data) => { 
                console.log(data);

        })
        res.json('uploadResponse')
      } catch (error) {
        console.error('Error:', error);
      }

})

app.get('/original',async (req,res)=>{
    let  options = {
        Bucket    : process.env.AWS_BUCKET,  //TODO: add env
        Key    : imageKey,
    };

    try {
        const downloadResponse = await s3.getObject(options).promise();
        const originalImageData = downloadResponse.Body;
        
        let params = {
            Bucket: process.env.AWS_BUCKET,
            Key: `test/${imageKey}.abc`,
            Body: originalImageData,
            ContentType: "image/png"
        }

        s3.upload(params, (error, data) => {
            res.json(data)
        })
      } catch (error) {
        console.error('Error:', error);
      }

})

app.get('/final',async (req, res) => {
    var arr =[{Key: 'whatsapp_images/w3JZfAAiduxkdmPG14omW7AyqbVYIOED5oJc5uwQ.png'}];
    // var arr =[{Key: 'test/production/storage/product/2022-05-13-627e1951cb6ce.png.abc'}];
    var counter = 0
    var dataCount = 0
    while (arr.length != 0) {
        console.log(arr[arr.length-1].Key);
        const response = await s3.listObjects(
            { 
             Bucket:process.env.AWS_BUCKET,
             Marker: arr[arr.length-1].Key,
            //  Prefix: 'test/'  
            }).promise();

        arr= response.Contents
        console.log('result' , arr[arr.length - 1].Key, 'counter',counter+=arr.length);

        // start compress

        for(let i = 0; i < arr.length; i++){
            console.log('dataCount',counter+i);
            let imageKey = arr[i].Key;
            let isImage = arr[i].Key.split('.')
            if(isImage[isImage.length - 1] != 'png' ) continue  
            console.log('here',isImage[isImage.length - 1]);
            const downloadResponse = await s3.getObject({Bucket:bucket,Key:imageKey}).promise();
            const originalImageData = downloadResponse.Body;

            const compressedImageData = await sharp(originalImageData).jpeg({ quality: 70 }).toBuffer();
            let params = {
              Bucket: process.env.AWS_BUCKET,
              Key: `${imageKey}`,
              Body: compressedImageData,
          }


  
          s3.upload(params, (error, data) => {
                  console.log(data);
  
          })
        }

    
    }
res.send(counter)
})



//read data from s3
app.get('/count', async (req, res)=>{
    var arr =[{Key: 'whatsapp_images/w3JZfAAiduxkdmPG14omW7AyqbVYIOED5oJc5uwQ.png'}];
    var counter = 0
    while (arr.length != 0) {
        
        const params = {
            Bucket: bucket,
            // Prefix: 'test/' //your folder name
            // Marker:"production/storage/product/2023-06-06-647e657637b2c.png"
            Marker: arr[arr.length-1].Key
        }
        console.log(arr[arr.length-1].Key);
        const response = await s3.listObjects(
            { 
             Bucket:process.env.AWS_BUCKET,
             Marker: arr[arr.length-1].Key
            //  Prefix: 'test/'  
            }).promise();

        arr= response.Contents
        console.log('result' , arr[arr.length - 1], 'counter',counter+=arr.length);

    
    }
res.send(counter)
})


app.get('/read', async (req, res)=>{
    const params = {
        Bucket: bucket,
        // Prefix: 'test/' //your folder name
        Marker:"whatsapp_images/w3JZfAAiduxkdmPG14omW7AyqbVYIOED5oJc5uwQ.png"
        // Marker:"افتراضي.jpg"
    }
    s3.listObjects(params, function (err, data) {
        console.log('lenght:', data.Contents.length);
        res.send(data);
    })
})
app.get('/delete', async (req, res) => {
    let key = req.query.key
  let image = key.split('/')
  const params = {
    Bucket: bucket,
    Key: req.query.key
  };
  console.log(key);
//   res.send(params)
  s3.deleteObject(params, function (err, data) {
    if(err) {
      return res.send(err);
    } else {
      return res.send(data);
    }
  });
})



app.get('/delete', async (req, res) => {
    let key = req.query.key
  let image = key.split('/')
  const params = {
    Bucket: bucket,
    Key: req.query.key
  };

  console.log(key);
//   res.send(params)
  s3.deleteObject(params, function (err, data) {
    if(err) {
      return res.send(err);
    } else {
      return res.send(data);
    }
  });
})


app.get('/tiny', async (req, res) => {
    try {
      const s3 = new AWS.S3();
      const bucketName = process.env.AWS_BUCKET;
      const imageKey = 'production/storage/product/2023-01-24-63cf92aec2660.png';
  
      const downloadResponse = await s3.getObject({ Bucket: bucketName, Key: imageKey }).promise();
      const originalImageData = downloadResponse.Body;
  
      // Compress the image using the TinyPNG API
      const tinyPngResponse = await fetch('https://api.tinify.com/shrink', {
        method: 'POST',
        body: originalImageData,
       
      });
      console.log("🚀 ~ file: app.js:100 ~ app.get ~ tinyPngResponse:", tinyPngResponse)
  
      if (tinyPngResponse.ok) {
        const compressedImageData = await tinyPngResponse.buffer();
  
        // Set appropriate headers for downloading the image
        // res.setHeader('Content-Disposition', `attachment; filename=${imageKey}`);
        // res.setHeader('Content-Type', 'image/jpeg');
  
        // Send the compressed image data back to the browser
        res.send(compressedImageData);
      } else {
        res.status(tinyPngResponse.status).send('Error compressing image with TinyPNG.',tinyPngResponse);
      }
    } catch (error) {
      res.status(500).send('Error downloading and compressing image.');
    }
  });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



// const random = [
//     ['yes','no'],
//     ['make','not'],
//     ['do','not'],
//     ['add',`don't`],
//     ['yes','no'],
// ]

// let newArr =[]
// random.forEach((e) => {
//     let num = Math.floor(Math.random() * 1000);
//     console.log('num: ', num);
//     if(num % 2==0) {
//         newArr.push(e[0])
//     }else{
//         newArr.push(e[1])  
//     }
// })

// console.log(newArr);     
 
