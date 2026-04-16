import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import { isLocalUser, LOCAL_USER_ID } from '@/utils/localUser';

interface UploadResult {
  s3Key: string;
  url: string;
}

/**
 * Get the current user's identity ID
 */
export const getIdentityId = async (): Promise<string> => {
  // For local users, return a placeholder
  if (await isLocalUser()) {
    return LOCAL_USER_ID;
  }

  const session = await fetchAuthSession();
  if (!session.identityId) {
    throw new Error('No identity ID found in session');
  }
  return session.identityId;
};

/**
 * Upload an image to S3
 * For local users, just return the local URI
 */
export const uploadImage = async (uri: string, fileName: string): Promise<UploadResult> => {
  // For local users, don't upload to S3 - just use the local URI
  if (await isLocalUser()) {
    const s3Key = `local/${Date.now()}_${fileName}`;
    return { s3Key, url: uri };
  }

  const identityId = await getIdentityId();
  const s3Key = `drinks/${Date.now()}_${fileName}`;

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Failed to fetch image for upload');
  }
  const blob = await response.blob();

  const uploadOperation = uploadData({
    path: `private/${identityId}/${s3Key}`,
    data: blob,
    options: {
      contentType: 'image/jpeg',
    },
  });

  await uploadOperation.result;

  const urlResult = await getUrl({
    path: `private/${identityId}/${s3Key}`,
  });

  return { s3Key, url: urlResult.url.toString() };
};

/**
 * Get a signed URL for an S3 image
 * For local users, the s3Key is actually the local URI
 */
export const getImageUrl = async (s3Key: string): Promise<string> => {
  // For local users, the s3Key is the local URI
  if ((await isLocalUser()) || s3Key.startsWith('local/') || s3Key.startsWith('file://')) {
    // Return a placeholder or the original URI if available
    return s3Key;
  }

  const identityId = await getIdentityId();

  const result = await getUrl({
    path: `private/${identityId}/${s3Key}`,
    options: { expiresIn: 3600 },
  });

  return result.url.toString();
};

/**
 * Delete an image from S3
 * For local users, this is a no-op
 */
export const deleteImage = async (s3Key: string): Promise<void> => {
  // For local users, nothing to delete from S3
  if ((await isLocalUser()) || s3Key.startsWith('local/')) {
    return;
  }

  const identityId = await getIdentityId();

  await remove({
    path: `private/${identityId}/${s3Key}`,
  });
};
