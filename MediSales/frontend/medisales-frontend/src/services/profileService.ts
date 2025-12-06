import api from './api';

/**
 * Profile service for handling profile picture operations
 */

export interface ProfilePictureResponse {
  hasPicture: boolean;
  pictureUrl: string | null;
  fileName: string | null;
  uploadedAt: string | null;
}

export interface UploadProfilePictureResponse {
  message: string;
  pictureUrl: string;
  fileName: string;
  uploadedAt: string;
}

/**
 * Uploads a profile picture for a user
 * @param userId - The ID of the user
 * @param formData - FormData containing the file
 * @returns Upload response with picture URL
 */
export const uploadProfilePicture = async (
  userId: number,
  formData: FormData
): Promise<UploadProfilePictureResponse> => {
  // Ensure userId is in the FormData
  formData.append('userId', userId.toString());

  const response = await api.post<UploadProfilePictureResponse>(
    `/users/${userId}/profile-picture`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

/**
 * Deletes a user's profile picture
 * @param userId - The ID of the user
 * @returns Success message
 */
export const deleteProfilePicture = async (userId: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/users/${userId}/profile-picture`);
  return response.data;
};

/**
 * Gets a user's profile picture information
 * @param userId - The ID of the user
 * @returns Profile picture information
 */
export const getProfilePicture = async (userId: number): Promise<ProfilePictureResponse> => {
  const response = await api.get<ProfilePictureResponse>(`/users/${userId}/profile-picture`);
  return response.data;
};

/**
 * Generates a UI Avatars URL for a user without a profile picture
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param background - Background color (hex without #)
 * @returns UI Avatars URL
 */
export const generateAvatarUrl = (
  firstName: string,
  lastName: string,
  background: string = '0ea5e9' // Default: blue-500
): string => {
  const name = `${firstName}+${lastName}`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=fff&size=200&bold=true`;
};

/**
 * Gets the profile picture URL or fallback to UI Avatars
 * @param profilePictureUrl - The user's profile picture URL from database
 * @param fullName - User's full name for avatar generation
 * @param baseUrl - Optional base URL for the API (defaults to http://localhost:5012)
 * @returns Complete profile picture URL or generated avatar URL
 */
export const getProfilePictureUrl = (
  profilePictureUrl: string | null | undefined,
  fullName: string,
  baseUrl: string = 'http://localhost:5012'
): string => {
  if (profilePictureUrl) {
    // If it's already a full URL, return it
    if (profilePictureUrl.startsWith('http')) {
      return profilePictureUrl;
    }
    // Otherwise, prepend the base URL
    return `${baseUrl}${profilePictureUrl}`;
  }

  // Generate avatar from name
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || 'User';
  const lastName = nameParts[1] || '';
  
  return generateAvatarUrl(firstName, lastName);
};

/**
 * Validates a file for profile picture upload
 * @param file - The file to validate
 * @returns Validation result
 */
export const validateProfilePicture = (
  file: File
): { valid: boolean; error?: string } => {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPG, PNG, and GIF images are allowed',
    };
  }

  return { valid: true };
};

const profileService = {
  uploadProfilePicture,
  deleteProfilePicture,
  getProfilePicture,
  generateAvatarUrl,
  getProfilePictureUrl,
  validateProfilePicture,
};

export default profileService;
