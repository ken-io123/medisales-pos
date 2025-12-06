import { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../context/authContext';
import ProfilePictureUpload from '../../components/admin/ProfilePictureUpload';
import { errorToast, successToast } from '../../utils/toast';
import { userService } from '../../services/userService';
import { PH_LOCALE, PH_TIME_ZONE } from '../../utils/formatters';
import type { User as UserType } from '../../types/User';

const ProfilePage = () => {
  const { user: currentUser, logout } = useAuth();
  const [userData, setUserData] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  const fetchUserData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const users = await userService.getAllUsers();
      const foundUser = users.find((u: UserType) => u.userId === currentUser.userId);
      if (foundUser) {
        setUserData(foundUser);
      }
    } catch (error) {
      errorToast('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = () => {
    successToast('Profile picture updated successfully!');
    fetchUserData();
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString(PH_LOCALE, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: PH_TIME_ZONE,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  if (!userData || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-brand-muted" />
          <p className="mt-3 text-sm font-semibold text-slate-900">Profile not found</p>
          <p className="text-xs text-brand-muted">Unable to load your profile information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="mt-1 text-sm text-brand-muted">View and manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>

          {/* Profile Content */}
          <div className="relative px-6 pb-6">
            {/* Profile Picture */}
            <div className="absolute -top-16 left-6">
              <div className="rounded-full border-4 border-white bg-white shadow-lg">
                <ProfilePictureUpload
                  userId={userData.userId}
                  currentPictureUrl={userData.profilePictureUrl || null}
                  fullName={userData.fullName || userData.username}
                  size="large"
                  editable={true}
                  onUploadSuccess={handleProfilePictureUpload}
                  onUploadError={(error) => errorToast(error)}
                />
              </div>
            </div>

            {/* Logout Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>

            {/* User Info */}
            <div className="mt-12 space-y-6">
              {/* Name and Role */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{userData.fullName || 'N/A'}</h2>
                <p className="text-sm text-brand-muted">@{userData.username}</p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-sm font-semibold text-white">
                  <Shield className="h-4 w-4" />
                  {userData.role}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-brand-muted">Email Address</p>
                      <p className="text-sm font-semibold text-slate-900">{userData.email || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-brand-muted">Phone Number</p>
                      <p className="text-sm font-semibold text-slate-900">{userData.phoneNumber || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="rounded-2xl border border-slate-200 p-6">
                <h3 className="mb-4 text-lg font-bold text-slate-900">Account Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-brand-muted">
                      <Calendar className="h-4 w-4" />
                      <span>Last Login</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatDate(userData.lastLoginDate)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-brand-muted">
                      <Calendar className="h-4 w-4" />
                      <span>Account Created</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatDate(userData.createdAt)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-brand-muted">
                      <Calendar className="h-4 w-4" />
                      <span>Last Updated</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatDate(userData.updatedAt)}</span>
                  </div>

                  {userData.profilePictureUploadedAt && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-brand-muted">
                        <User className="h-4 w-4" />
                        <span>Profile Picture Updated</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{formatDate(userData.profilePictureUploadedAt)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <div className="flex items-center gap-2 text-sm text-brand-muted">
                      <Shield className="h-4 w-4" />
                      <span>Account Status</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        userData.status === 'Online'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {userData.status === 'Online' ? '✓' : '○'} {userData.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Status */}
              {userData.isOnlineNow && (
                <div className="rounded-2xl bg-green-50 p-4">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                    </span>
                    <span className="text-sm font-semibold text-green-700">You are currently online</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 rounded-2xl bg-blue-50 p-6">
          <h3 className="text-sm font-semibold text-blue-900">Profile Picture Tips</h3>
          <ul className="mt-2 space-y-1 text-xs text-blue-700">
            <li>• Hover over your profile picture to upload a new one</li>
            <li>• Supported formats: JPG, PNG, GIF</li>
            <li>• Maximum file size: 5MB</li>
            <li>• For best results, use a square image (e.g., 500x500 pixels)</li>
            <li>• Click the X button to remove your current picture</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
