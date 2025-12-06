import React, { useState, useRef } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import profileService from '../../services/profileService';

interface ProfilePictureUploadProps {
  userId: number;
  currentPictureUrl: string | null;
  fullName: string;
  onUploadSuccess?: (pictureUrl: string) => void;
  onUploadError?: (error: string) => void;
  size?: 'small' | 'medium' | 'large';
  editable?: boolean;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  userId,
  currentPictureUrl,
  fullName,
  onUploadSuccess,
  onUploadError,
  size = 'medium',
  editable = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [pictureUrl, setPictureUrl] = useState(currentPictureUrl);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size classes
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-24 h-24',
    large: 'w-40 h-40',
  };

  const iconSizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  const buttonSizeClasses = {
    small: 'w-7 h-7',
    medium: 'w-10 h-10',
    large: 'w-12 h-12',
  };

  // Get the profile picture URL or fallback
  const displayUrl = profileService.getProfilePictureUrl(pictureUrl, fullName);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = profileService.validateProfilePicture(file);
    if (!validation.valid) {
      if (onUploadError) {
        onUploadError(validation.error || 'Invalid file');
      }
      return;
    }

    // Upload file
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId.toString());

      const response = await profileService.uploadProfilePicture(userId, formData);
      
      // Update local state
      setPictureUrl(response.pictureUrl);

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(response.pictureUrl);
      }
    } catch (error: any) {
      console.error('Failed to upload profile picture:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload profile picture';
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePicture = async () => {
    try {
      setUploading(true);
      await profileService.deleteProfilePicture(userId);
      
      // Update local state to show fallback avatar
      setPictureUrl(null);

      if (onUploadSuccess) {
        onUploadSuccess('');
      }
    } catch (error: any) {
      console.error('Failed to delete profile picture:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete profile picture';
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Profile Picture */}
      <div className={`${sizeClasses[size]} overflow-hidden bg-gray-200 border border-slate-200 shadow-sm`}>
        <img
          src={displayUrl}
          alt={fullName}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Upload/Delete Overlay - Only show if editable */}
      {editable && (
        <>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Camera Button */}
          {(isHovering || uploading) && (
            <button
              onClick={handleCameraClick}
              disabled={uploading}
              className={`absolute bottom-0 right-0 ${buttonSizeClasses[size]} bg-slate-900 flex items-center justify-center text-white shadow-sm hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Change profile picture"
            >
              {uploading ? (
                <Loader2 className={`${iconSizeClasses[size]} animate-spin`} />
              ) : (
                <Camera className={iconSizeClasses[size]} />
              )}
            </button>
          )}

          {/* Delete Button - Only show if user has uploaded picture */}
          {pictureUrl && isHovering && !uploading && (
            <button
              onClick={handleDeletePicture}
              className={`absolute top-0 right-0 w-6 h-6 bg-red-600 flex items-center justify-center text-white shadow-sm hover:bg-red-700 transition-all duration-200`}
              title="Remove profile picture"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </>
      )}

      {/* Uploading Overlay */}
      {uploading && (
        <div className={`absolute inset-0 ${sizeClasses[size]} bg-black bg-opacity-50 flex items-center justify-center`}>
          <Loader2 className={`${iconSizeClasses[size]} text-white animate-spin`} />
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload;
