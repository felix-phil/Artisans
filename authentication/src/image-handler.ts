import aws from 'aws-sdk';
// import sharp from 'sharp';

export class ImageHandler {
  private _storage?: aws.S3;
  private _s3BucketName?: string;

  get storage() {
    if (!this._storage) {
      throw new Error('No storage has been initialized');
    }
    return this._storage;
  }
  get s3BucketName() {
    if (!this._s3BucketName) {
      throw new Error('No storage has been initialized');
    }
    return this._s3BucketName;
  }

  initializeS3Storage(
    bucketName: string,
    region: string,
    accessKey: string,
    secretKey: string
  ) {
    this._s3BucketName = bucketName;

    this._storage = new aws.S3({
      region: region,
      signatureVersion: 'v4',
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
  }
  uploadFile(keyPath: string, buffer: Buffer, mimeType: string) {
    return new Promise((resolve, reject) => {
      this.storage.putObject(
        {
          Bucket: this.s3BucketName,
          ContentType: mimeType,
          Key: keyPath,
          Body: buffer,
        },
        (err, data) => {
          if (err) {
            reject(err);
          }
          resolve(data);
        }
      );
    });
  }
  getUploadedFileSignUrl(keyPath: string, expires: number = 3600): string {
    let dataUrl = '';
    this.storage.getSignedUrl(
      'getObject',
      {
        Bucket: this.s3BucketName,
        Key: keyPath,
        Expires: expires,
      },
      (err, url) => {
        if (err) {
          throw err;
        }
        dataUrl = url;
      }
    );
    return dataUrl;
  }
  // static async resizeImage(img: Buffer, size: [number, number] = [200, 200]) {
  //   const resizedImageBuffer = await sharp(img)
  //     .resize(size[0], size[1])
  //     .toBuffer();
  //   return resizedImageBuffer;
  // }
  static buildKey(
    serviceName: string,
    collection: string,
    originalFilename: string
  ) {
    const date = new Date();
    return `${serviceName}/${collection}/${
      date.toISOString() + '-' + originalFilename
    }`;
  }
}
export const imageHandler = new ImageHandler();
