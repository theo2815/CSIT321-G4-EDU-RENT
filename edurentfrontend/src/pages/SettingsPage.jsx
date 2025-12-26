import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ToggleSwitch from '../components/ToggleSwitch';
import LoadingOverlay from '../components/LoadingOverlay';

// Custom hooks for managing auth state, likes, and global UI logic
import useAuth from '../hooks/useAuth';
import useLikes from '../hooks/useLikes';
import usePageLogic from '../hooks/usePageLogic';

// New Feedback Hook
import { useToast } from '../hooks/useToast';

// Components
import Header from '../components/Header';
import defaultAvatar from '../assets/default-avatar.png';

// API & Services
import {
  getCurrentUser,
  updateUserProfile,
  changePassword,
  upsertNotificationPreferences,
  getNotificationPreferences,
  uploadProfilePicture // NEW
} from '../services/apiService';

// Styles
import '../static/SettingsPage.css';
import { useTheme } from '../hooks/useTheme';

// A loading skeleton to keep the UI stable while fetching user data
function SettingsSkeleton() {
  return (
    <div className="settings-page">
      <div className="settings-layout-container">
        {/* Sidebar Skeleton */}
        <aside className="settings-sidebar" style={{ borderRight: '1px solid #eee' }}>
          <div className="skeleton skeleton-sidebar-item" style={{ width: '70%' }}></div>
          <div className="skeleton skeleton-sidebar-item" style={{ width: '80%' }}></div>
          <div className="skeleton skeleton-sidebar-item" style={{ width: '60%' }}></div>
          <div className="skeleton skeleton-sidebar-item" style={{ width: '75%' }}></div>
        </aside>
        {/* Content Skeleton */}
        <main className="settings-content">
          <div className="skeleton skeleton-settings-card"></div>
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS (FORMS) ---

// Handles editing public profile info and uploading a new avatar
function EditProfileForm({ userData, profileData, onChange, onSave, onCancel, onPickPhoto, uploading }) {
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Validation logic
  const validate = () => {
    const newErrors = {};
    if (!profileData.fullName || profileData.fullName.trim() === "") {
      newErrors.fullName = "Full Name is required.";
    }
    if (!profileData.address || profileData.address.trim() === "") {
      newErrors.address = "Address is required.";
    }
    // schoolName is read-only, so skip
    if (!profileData.email || profileData.email.trim() === "") {
      newErrors.email = "Email is required.";
    }
    if (!profileData.phoneNumber || profileData.phoneNumber.trim() === "") {
      newErrors.phoneNumber = "Phone number is required.";
    } else if (!/^\d{11}$/.test(profileData.phoneNumber.trim())) {
      newErrors.phoneNumber = "Phone number must be exactly 11 digits.";
    }
    // bio is optional
    return newErrors;
  };

  // Wrap the onSave to exit edit mode after successful save, only if valid
  const handleSave = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return false;
    }
    setSaving(true);
    const result = await onSave(e);
    setSaving(false);
    
    // If onSave returns true (or success), exit edit mode
    if (result !== false) {
      setEditMode(false);
    }
  };

  // Local state for editMode is fine, but we need to trigger onCancel when clicking Cancel
  const [editMode, setEditMode] = useState(false);

  const handleCancelClick = () => {
    onCancel(); 
    setEditMode(false);
  };

  // Logic to decide which image to display: the new upload, the existing one, or a default
  const getProfileSrc = () => {
    // 1. Show the newly uploaded preview if available
    if (profileData.profilePictureUrl) return profileData.profilePictureUrl;

    // 2. Show the existing photo from the database
    if (userData?.profilePictureUrl) {
      // Check if it's already a full URL (Supabase) or needs the backend host (Local)
      if (userData.profilePictureUrl.startsWith('http')) {
        return userData.profilePictureUrl;
      }
      return `http://localhost:8080${userData.profilePictureUrl}`;
    }

    // 3. Fallback to default
    return defaultAvatar;
  };

  return (
    <section className="settings-card">
      <LoadingOverlay isVisible={saving} message="Saving profile..." />
      <h2 className="settings-card-title">Edit Profile</h2>
      <div className="profile-photo-section">
        <div className="profile-photo-container">
          <img
            src={getProfileSrc()}
            alt="Profile"
            className="profile-photo-placeholder"
            style={{ objectFit: 'cover' }}
          />
          {uploading && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'
            }}>
              <div className="newtons-cradle">
                <div className="newtons-cradle__dot"></div>
                <div className="newtons-cradle__dot"></div>
                <div className="newtons-cradle__dot"></div>
                <div className="newtons-cradle__dot"></div>
              </div>
            </div>
          )}
          {editMode && (
            <button type="button" className="edit-icon-overlay" title="Change photo" onClick={onPickPhoto} disabled={uploading}>
              ✏️
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>Profile Picture</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {uploading ? 'Uploading...' : 'PNG, JPG up to 5MB'}
          </span>
        </div>
      </div>
      <form onSubmit={handleSave} noValidate>
        {/* Account Details */}
        <div className="form-section">
          <span className="form-section-label">Account details (Public)</span>
          <div className="form-grid">
            <div>
              <label htmlFor="fullName" className="form-label">Full Name</label>
              <input type="text" id="fullName" name="fullName" value={profileData.fullName || ''} onChange={onChange} className={`form-input${!editMode ? ' readonly' : ''}`} readOnly={!editMode} />
              {errors.fullName && <div className="form-error error-red">{errors.fullName}</div>}
            </div>
            <div>
              <label htmlFor="address" className="form-label">Address</label>
              <input type="text" id="address" name="address" value={profileData.address || ''} onChange={onChange} className={`form-input${!editMode ? ' readonly' : ''}`} readOnly={!editMode} />
              {errors.address && <div className="form-error error-red">{errors.address}</div>}
            </div>
            <div>
              <label htmlFor="schoolName" className="form-label">School</label>
              <input type="text" id="schoolName" name="schoolName" value={profileData.schoolName || ''} readOnly className="form-input readonly" />
            </div>
            <div style={{ gridColumn: 'span 1 / span 2' }}>
              <label htmlFor="bio" className="form-label">Bio</label>
              <textarea id="bio" name="bio" value={profileData.bio || ''} onChange={onChange} className={`form-input form-textarea${!editMode ? ' readonly' : ''}`} placeholder="Tell us a little about yourself..." readOnly={!editMode} />
            </div>
          </div>
        </div>
        {/* Private Details */}
        <div className="form-section">
          <span className="form-section-label">Private details</span>
          <div className="form-grid form-grid-cols-2">
            <div>
              <label htmlFor="email" className="form-label">Email</label>
              <input type="email" id="email" name="email" value={profileData.email || ''} readOnly className="form-input readonly" />
              {errors.email && <div className="form-error error-red">{errors.email}</div>}
            </div>
            <div>
              <label htmlFor="phoneNumber" className="form-label">Phone number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={profileData.phoneNumber || ''}
                maxLength={11}
                onChange={e => {
                  // Only allow digits and up to 11 characters
                  const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                  onChange({ target: { name: 'phoneNumber', value: val } });
                }}
                className={`form-input${!editMode ? ' readonly' : ''}`}
                readOnly={!editMode}
              />
              {errors.phoneNumber && <div className="form-error error-red">{errors.phoneNumber}</div>}
            </div>
          </div>
        </div>
        {/* Social Links */}
        <div className="form-section">
          <span className="form-section-label">Social Links</span>
          <div className="form-grid form-grid-cols-2">
            <div>
              <label htmlFor="facebookUrl" className="form-label social-input-label">
                <span className="social-label-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </span> Facebook URL
              </label>
              <input
                type="url"
                id="facebookUrl"
                name="facebookUrl"
                value={profileData.facebookUrl || ''}
                onChange={onChange}
                className={`form-input${!editMode ? ' readonly' : ''}`}
                readOnly={!editMode}
                placeholder="https://facebook.com/yourprofile"
              />
              {errors.facebookUrl && <div className="form-error error-red">{errors.facebookUrl}</div>}
            </div>
            <div>
              <label htmlFor="instagramUrl" className="form-label social-input-label">
                <span className="social-label-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </span> Instagram URL
              </label>
              <input
                type="url"
                id="instagramUrl"
                name="instagramUrl"
                value={profileData.instagramUrl || ''}
                onChange={onChange}
                className={`form-input${!editMode ? ' readonly' : ''}`}
                readOnly={!editMode}
                placeholder="https://instagram.com/yourhandle"
              />
              {errors.instagramUrl && <div className="form-error error-red">{errors.instagramUrl}</div>}
            </div>
          </div>
          <div className="form-hint" style={{ marginTop: '0.5rem' }}>
            Add your social media profiles to share on your public profile.
          </div>
        </div>
        {/* Bottom Actions: Edit Trigger or Save/Cancel */}
        <div className="save-button-container">
          {!editMode ? (
            <div style={{ textAlign: 'right' }}>
              <button type="button" className="btn-save" onClick={() => setEditMode(true)}>
                Edit Details
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={handleCancelClick}
                disabled={uploading || saving}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-save" 
                disabled={uploading || saving}
              >
                {saving ? 'Saving...' : (uploading ? 'Uploading...' : 'Save Changes')}
              </button>
            </div>
          )}
        </div>
      </form>
    </section>
  );
}

// Allows the user to change their password
function ChangePasswordForm() {
  const { showSuccess, showError } = useToast();
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const validateStrength = (pwd) => {
    // Basic strength rule: min 8 chars with a number
    const minLen = pwd.length >= 8;
    const hasNumber = /\d/.test(pwd);
    return minLen && hasNumber;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      showError('New passwords do not match.');
      return;
    }
    if (!validateStrength(passwords.newPassword)) {
      showError('New password must be at least 8 characters and include a number.');
      return;
    }

    setLoading(true);
    try {
      // Delegate to backend: verifies current and updates to new
      await changePassword(passwords.currentPassword, passwords.newPassword);
      showSuccess('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Password change failed:', err);
      const serverMsg = err?.response?.data?.message;
      showError(serverMsg || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="settings-card">
      <LoadingOverlay isVisible={loading} message="Updating password..." />
      <h2 className="settings-card-title">Change password</h2>
      <form onSubmit={handleSubmit} className="password-form-section">
        <div className="password-input-group">
          <div>
            <label htmlFor="currentPassword" className="form-label">Current password</label>
            <input type="password" id="currentPassword" name="currentPassword" value={passwords.currentPassword} onChange={handleChange} required className="form-input" />
          </div>
          <div>
            <label htmlFor="newPassword" className="form-label">New password</label>
            <input type="password" id="newPassword" name="newPassword" value={passwords.newPassword} onChange={handleChange} required className="form-input" />
            <div className="form-hint" style={{ marginTop: '0.4rem' }}>Use at least 8 characters and include a number.</div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" value={passwords.confirmPassword} onChange={handleChange} required className="form-input" />
          </div>
        </div>

        <div className="save-button-container">
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </section>
  );
}

// Manages notification preferences
function NotificationSettingsForm({ userId }) {
  const { showError } = useToast();
  const [notifications, setNotifications] = useState({
    all: true,
    likes: true,
    messages: true,
    email: false,
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load existing preferences from Supabase
  useEffect(() => {
    let isMounted = true;
    const loadPrefs = async () => {
      if (!userId) return;
      try {
        const prefs = await getNotificationPreferences(userId);
        if (!isMounted) return;
        setNotifications({
          all: !!prefs.all_notifications,
          likes: !!prefs.likes,
          messages: !!prefs.messages,
          email: !!prefs.email,
        });
        setLoaded(true);
      } catch (e) {
        console.error('Failed to load notification preferences:', e);
      }
    };
    loadPrefs();
    return () => { isMounted = false; };
  }, [userId]);

  const persist = async (state) => {
    if (!userId) return;
    setSaving(true);
    try {
      await upsertNotificationPreferences({
        user_id: userId,
        all_notifications: state.all,
        likes: state.likes,
        messages: state.messages,
        email: state.email,
      });
      
      // Dispatch event to notify other components (e.g., Header) about preference changes
      window.dispatchEvent(new CustomEvent('notification-preferences-changed', {
        detail: {
          all_notifications: state.all,
          likes: state.likes,
          messages: state.messages,
          email: state.email
        }
      }));
    } catch (e) {
      console.error('Failed to save notification preferences:', e);
      showError('Failed to save settings. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    setNotifications(prev => {
      const newState = { ...prev, [key]: !prev[key] };

      // "All notifications" controls likes and messages together (email is a separate delivery channel)
      if (key === 'all') {
        const allValue = newState.all;
        // When toggling "All", sync likes and messages but leave email independent
        const next = { ...newState, all: allValue, likes: allValue, messages: allValue };
        persist(next);
        return next;
      } else if (key === 'email') {
        // Email is independent - just persist without affecting "all"
        persist(newState);
        return newState;
      } else {
        // For likes or messages: update "all" to reflect if both are enabled
        const allShouldBeOn = newState.likes && newState.messages;
        const next = { ...newState, all: allShouldBeOn };
        persist(next);
        return next;
      }
    });
  };

  return (
    <section className="settings-card">
      <h2 className="settings-card-title">Notification</h2>
      <div className="notification-settings-list">
        <div className="notification-item">
          <span className="notification-label">All notification</span>
          <ToggleSwitch checked={notifications.all} onChange={() => handleToggle('all')} disabled={!loaded || saving} />
        </div>
        <div className="notification-item">
          <span className="notification-label">Like of my listing</span>
          <ToggleSwitch checked={notifications.likes} onChange={() => handleToggle('likes')} disabled={!loaded || saving} />
        </div>
        <div className="notification-item">
          <span className="notification-label">Message</span>
          <ToggleSwitch checked={notifications.messages} onChange={() => handleToggle('messages')} disabled={!loaded || saving} />
        </div>
        <div className="notification-item">
          <span className="notification-label">Email</span>
          <ToggleSwitch checked={notifications.email} onChange={() => handleToggle('email')} disabled={!loaded || saving} />
        </div>
        {!loaded && (
          <div className="form-hint" style={{ marginTop: '0.5rem' }}>Loading preferences…</div>
        )}
        {saving && (
          <div className="form-hint" style={{ marginTop: '0.5rem' }}>Saving…</div>
        )}
      </div>
    </section>
  );
}

// Allows switching between Light and Dark mode
function ThemeSettingsForm() {
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme || 'light');

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  const handleThemeSelect = (next) => {
    setSelectedTheme(next);
    setTheme(next);
  };

  return (
    <section className="settings-card">
      <h2 className="settings-card-title">Theme</h2>
      <div className="theme-options-container">
        <div
          className={`theme-option-box light-theme ${selectedTheme === 'light' ? 'selected' : ''}`}
          onClick={() => handleThemeSelect('light')}
          role="button" tabIndex={0}
        >
          <div className="theme-preview-header"></div>
          <div className="theme-preview-line"></div>
          <div className="theme-preview-line short"></div>
          <div className="theme-option-label">Light</div>
        </div>

        <div
          className={`theme-option-box dark-theme ${selectedTheme === 'dark' ? 'selected' : ''}`}
          onClick={() => handleThemeSelect('dark')}
          role="button" tabIndex={0}
        >
          <div className="theme-preview-header"></div>
          <div className="theme-preview-line"></div>
          <div className="theme-preview-line short"></div>
          <div className="theme-option-label">Dark</div>
        </div>
      </div>
    </section>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function SettingsPage() {
  const { retryAuth, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize Toast
  const { showSuccess, showError } = useToast();

  // Local state for the edit profile form
  const [profileData, setProfileData] = useState({
    fullName: '',
    address: '',
    schoolName: '',
    bio: '',
    email: '',
    phoneNumber: '',
    profilePictureUrl: '',
    facebookUrl: '',
    instagramUrl: '',
  });

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Connect shared logic for notifications
  const likesHook = useLikes();
  const {
    handleNotificationClick,
    ModalComponent,
  } = usePageLogic(userData, likesHook);

  // Determine which tab is active based on the URL path
  const activeSetting = (() => {
    if (location.pathname.includes('/password')) return 'change-password';
    if (location.pathname.includes('/notifications')) return 'notification';
    if (location.pathname.includes('/theme')) return 'theme';
    return 'edit-profile';
  })();

  // Fetch current user details when the page loads
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getCurrentUser();
        const fetchedUser = response.data;
        setUserData(fetchedUser);

        // Fill the form with existing data
        setProfileData({
          fullName: fetchedUser.fullName || '',
          address: fetchedUser.address || '',
          schoolName: fetchedUser.school?.name || 'N/A',
          bio: fetchedUser.bio || '',
          email: fetchedUser.email || '',
          phoneNumber: fetchedUser.phoneNumber || '',
          profilePictureUrl: fetchedUser.profilePictureUrl || '',
          facebookUrl: fetchedUser.facebookUrl || '',
          instagramUrl: fetchedUser.instagramUrl || '',
        });
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError("Could not load user data.");
        if (err.message === "No authentication token found.") {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({ ...prevData, [name]: value }));
  };

  // Handles uploading the new avatar image to Backend (Cloudinary)
  const handleUploadPhoto = async (file) => {
    if (!file || !userData?.userId) return;
    setUploading(true);
    try {
      // Use the new API service method
      const publicUrl = await uploadProfilePicture(file);
      console.log("New Profile Pic URL:", publicUrl);

      // Update the preview immediately
      setProfileData(prev => ({ ...prev, profilePictureUrl: publicUrl }));

    } catch (err) {
      console.error('Avatar upload failed:', err);
      showError('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Returns false if error, undefined if success
  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: profileData.fullName,
        address: profileData.address,
        bio: profileData.bio,
        phoneNumber: profileData.phoneNumber,
        profilePictureUrl: profileData.profilePictureUrl,
        facebookUrl: profileData.facebookUrl,
        instagramUrl: profileData.instagramUrl
      };

      // 1. Send update to the backend
      const res = await updateUserProfile(payload);
      // 2. Update local component state
      setUserData(res.data);
      // 3. Refresh global auth state so the Header updates immediately
      await retryAuth();

      showSuccess('Profile updated successfully!');
      // Success: return true to let EditProfileForm exit edit mode
      return true;
    } catch (err) {
      console.error('Failed to update profile:', err);
      showError(err.response?.data?.message || 'Failed to update profile');
      // Prevent exiting edit mode
      return false;
    }
  };

  const handleCancelProfileEdit = () => {
    // Revert profileData to original userData
    if (userData) {
      setProfileData({
        fullName: userData.fullName || '',
        address: userData.address || '',
        schoolName: userData.school?.name || 'N/A',
        bio: userData.bio || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        profilePictureUrl: userData.profilePictureUrl || '',
        facebookUrl: userData.facebookUrl || '',
        instagramUrl: userData.instagramUrl || '',
      });
    }
  };


  if (isLoading) {
    return (
      <div className="profile-page">
        <Header userName="" onLogout={logout} />
        <SettingsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <Header userName="" onLogout={logout} />
        <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header userName={userData?.fullName?.split(' ')[0]}
        profilePictureUrl={userData?.profilePictureUrl}
        onLogout={logout}
        onNotificationClick={handleNotificationClick}
      />

      <div className="settings-page">
        <div className="settings-layout-container">
          {/* Sidebar Navigation */}
          <aside className="settings-sidebar">
            <nav>
              <ul className="settings-nav-list">
                <li className="settings-nav-item">
                  <Link to="/settings/profile" className={activeSetting === 'edit-profile' ? 'active' : ''}>Edit Profile</Link>
                </li>
                <li className="settings-nav-item">
                  <Link to="/settings/password" className={activeSetting === 'change-password' ? 'active' : ''}>Change Password</Link>
                </li>
                <li className="settings-nav-item">
                  <Link to="/settings/notifications" className={activeSetting === 'notification' ? 'active' : ''}>Notification</Link>
                </li>
                <li className="settings-nav-item">
                  <Link to="/settings/theme" className={activeSetting === 'theme' ? 'active' : ''}>Theme</Link>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content Area switches based on the active route */}
          <main className="settings-content">
            {activeSetting === 'edit-profile' && (
              <EditProfileForm
                userData={userData}
                profileData={profileData}
                onChange={handleProfileChange}
                onSave={handleProfileSave}
                onCancel={handleCancelProfileEdit}
                onPickPhoto={() => fileInputRef.current?.click()}
                uploading={uploading}
              />
            )}
            {activeSetting === 'change-password' && (
              <ChangePasswordForm userEmail={userData?.email} />
            )}
            {activeSetting === 'notification' && (
              <NotificationSettingsForm userId={userData?.userId} />
            )}
            {activeSetting === 'theme' && <ThemeSettingsForm />}
          </main>
        </div>
      </div>

      {/* Hidden container for shared modal logic */}
      <ModalComponent />

      {/* Invisible input used for uploading profile pictures */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleUploadPhoto(e.target.files[0]);
          }
          e.target.value = '';
        }}
        style={{ display: 'none' }}
      />
    </div>
  );
}