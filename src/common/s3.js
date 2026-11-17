const { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  ListObjectsV2Command, 
  HeadObjectCommand,
  DeleteObjectCommand 
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const config = require("../config/config");
const { s3Client } = require("../db/s3Client");

const bucketName = config.aws.bucket;

/**
 * Uploads a file to AWS S3
 * @param {String} folder
 * @param {String} fileName
 * @param {Buffer} fileBuffer
 * @param {String} contentType
 */
const uploadToS3 = async (
  folder,
  fileName,
  fileBuffer,
  contentType = "application/pdf",
) => {
  try {
    const sanitizedFolder = folder;
    //console.log("Sanitizer folder name ", sanitizedFolder, fileName);
    const filePath = `${sanitizedFolder}/${fileName}`;
    const params = {
      Bucket: bucketName,
      Key: filePath,
      Body: fileBuffer,
      ContentType: contentType,
    };

    await s3Client.send(new PutObjectCommand(params));
    const fullUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`;

    // console.log(`✅ Uploaded ${fullUrl} to S3`);
    // console.log(filePath ,`https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`)
    // Public S3 URL
    // return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`;
      return {
      key: filePath,
      url: fullUrl
    };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("Failed to upload file to S3");
  }
};

/**
 * Uploads an image to AWS S3
 */
const uploadImageToS3 = async ({
  folder,
  fileName,
  fileBuffer,
  mimeType = "image/jpeg",
}) => {
  try {
    return await uploadToS3(folder, fileName, fileBuffer, mimeType);
  } catch (error) {
    console.error("Error uploading image to S3:", error);
    throw new Error("Image upload to S3 failed.");
  }
};

/**
 * Get object from S3
 * @param {string} key - S3 object key
 * @returns {Promise<Buffer>} - File buffer
 */
const getObjectFromS3 = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    // Convert readable stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error getting object from S3:', error);
    throw new Error(`Failed to get object from S3: ${error.message}`);
  }
};

/**
 * Check if object exists in S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>} - True if object exists
 */
const objectExistsInS3 = async (key) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    console.error('Error checking object existence:', error);
    return false;
  }
};

/**
 * List objects in S3 bucket with prefix
 * @param {string} prefix - Prefix to filter objects
 * @returns {Promise<Array>} - List of objects
 */
const listObjectsInS3 = async (prefix) => {
  try {
    const objects = [];
    let continuationToken = undefined;
    
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });
      
      const response = await s3Client.send(command);
      
      if (response.Contents) {
        objects.push(...response.Contents);
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    return objects;
  } catch (error) {
    console.error('Error listing objects from S3:', error);
    throw new Error(`Failed to list objects from S3: ${error.message}`);
  }
};

/**
 * Generate presigned URL for S3 object
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string>} - Presigned URL
 */
const getPresignedUrl = async (key, expiresIn = 3600) => {
  //console.log("getPresignedUrl----------------------------")
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    //console.log( "Pre signer url from s3 - - - -- - -- ", presignedUrl)
    return presignedUrl;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

/**
 * Delete object from S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>} - True if deleted successfully
 */
const deleteObjectFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    await s3Client.send(command);
    //console.log(`✅ Deleted ${key} from S3`);
    return true;
  } catch (error) {
    console.error('Error deleting object from S3:', error);
    throw new Error(`Failed to delete object from S3: ${error.message}`);
  }
};

/**
 * Get object metadata from S3
 * @param {string} key - S3 object key
 * @returns {Promise<Object>} - Object metadata
 */
const getObjectMetadata = async (key) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    return {
      size: response.ContentLength,
      lastModified: response.LastModified,
      contentType: response.ContentType,
      etag: response.ETag,
      metadata: response.Metadata,
    };
  } catch (error) {
    console.error('Error getting object metadata from S3:', error);
    throw new Error(`Failed to get object metadata: ${error.message}`);
  }
};

/**
 * Generate public URL for S3 object (only works for public buckets)
 * @param {string} key - S3 object key
 * @returns {string} - Public URL
 */
const getPublicUrl = (key) => {
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

module.exports = {
  s3Client,
  uploadToS3,
  uploadImageToS3,
  getObjectFromS3,
  objectExistsInS3,
  listObjectsInS3,
  getPresignedUrl,
  deleteObjectFromS3,
  getObjectMetadata,
  getPublicUrl,
};