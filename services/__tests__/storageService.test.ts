import { getIdentityId, uploadImage, getImageUrl, deleteImage } from '../storageService';

// Mock aws-amplify modules
jest.mock('aws-amplify/auth', () => ({
  fetchAuthSession: jest.fn(),
}));

jest.mock('aws-amplify/storage', () => ({
  uploadData: jest.fn(),
  getUrl: jest.fn(),
  remove: jest.fn(),
}));

import { fetchAuthSession } from 'aws-amplify/auth';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';

// Mock fetch for image upload
global.fetch = jest.fn();

describe('storageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getIdentityId', () => {
    it('returns identityId from session', async () => {
      (fetchAuthSession as jest.Mock).mockResolvedValue({
        identityId: 'test-identity-id',
      });

      const result = await getIdentityId();
      expect(result).toBe('test-identity-id');
    });

    it('throws error when identityId is missing', async () => {
      (fetchAuthSession as jest.Mock).mockResolvedValue({
        identityId: null,
      });

      await expect(getIdentityId()).rejects.toThrow(
        'No identity ID found - authentication may have failed'
      );
    });
  });

  describe('uploadImage', () => {
    it('uploads image and returns s3Key and url', async () => {
      (fetchAuthSession as jest.Mock).mockResolvedValue({
        identityId: 'test-identity',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'])),
      });

      (uploadData as jest.Mock).mockReturnValue({
        result: Promise.resolve({}),
      });

      (getUrl as jest.Mock).mockResolvedValue({
        url: new URL('https://s3.example.com/image.jpg'),
      });

      const result = await uploadImage('file://image.jpg', 'test.jpg');

      expect(result.s3Key).toMatch(/drinks\/\d+_test\.jpg/);
      expect(result.url).toBe('https://s3.example.com/image.jpg');
      expect(uploadData).toHaveBeenCalled();
    });

    it('throws error when fetch fails', async () => {
      (fetchAuthSession as jest.Mock).mockResolvedValue({
        identityId: 'test-identity',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      await expect(uploadImage('file://bad.jpg', 'bad.jpg')).rejects.toThrow(
        'Failed to fetch image for upload'
      );
    });
  });

  describe('getImageUrl', () => {
    it('returns signed URL for image', async () => {
      (fetchAuthSession as jest.Mock).mockResolvedValue({
        identityId: 'test-identity',
      });

      (getUrl as jest.Mock).mockResolvedValue({
        url: new URL('https://s3.example.com/signed-url.jpg'),
      });

      const result = await getImageUrl('drinks/test.jpg');

      expect(result).toBe('https://s3.example.com/signed-url.jpg');
      expect(getUrl).toHaveBeenCalledWith({
        path: 'private/test-identity/drinks/test.jpg',
        options: { expiresIn: 3600 },
      });
    });
  });

  describe('deleteImage', () => {
    it('removes image from S3', async () => {
      (fetchAuthSession as jest.Mock).mockResolvedValue({
        identityId: 'test-identity',
      });

      (remove as jest.Mock).mockResolvedValue(undefined);

      await deleteImage('drinks/test.jpg');

      expect(remove).toHaveBeenCalledWith({
        path: 'private/test-identity/drinks/test.jpg',
      });
    });
  });
});
