export const imageHandler = {
  initializeS3Storage: jest.fn(),
  uploadFile: jest
    .fn()
    .mockImplementation((keyPath: string, buffer: Buffer, mimeType) => {
      return { eid: 'aldkfadfaf,dafdieafdmnadfdfasfd' };
    }),
  getUploadedFileSignUrl: jest
    .fn()
    .mockImplementation((key: string, expire = 3600) => {
      return `https://theartisansfakebucket.s3.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=FAKEACCESSIDAWS%2F20220511%2Fartisan-west-1%2Fs3%2Faws4_request&X-Amz-Date=${new Date().toISOString()}&X-Amz-Expires=3600&X-Amz-Signature=c6c590f16de38d9faddd39e492251a04d426d7ca1b6d2e3606d749609f7ab7e5&X-Amz-SignedHeaders=host`;
    }),
};
export const ImageHandler = {
  buildKey: jest
    .fn()
    .mockImplementation(
      (serviceName: string, collection: string, originalFilename: string) => {
        const date = new Date();
        return `${serviceName}/${collection}/${
          date.toISOString() + '-' + originalFilename
        }`;
      }
    ),
};
