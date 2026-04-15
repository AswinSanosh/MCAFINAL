"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../lib/AuthContext";
import { updateProfile } from "../../lib/auth";

export default function ProfilePage() {
  const { user, refreshAuth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    bio: user?.bio || "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    setErrors({});
    setSaveMessage("");

    const result = await updateProfile(formData);

    if (result.success) {
      setSaveMessage("Profile updated successfully!");
      setIsEditing(false);
      await refreshAuth();
    } else {
      setErrors(result.errors || {});
    }

    setIsSaving(false);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  if (!user) {
    return null;
  }

  return (
    <main className="flex flex-1 flex-col items-center min-h-screen bg-linear-to-b from-gray-900 via-gray-900 to-gray-800 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your account settings</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-900/60 border border-gray-700/60 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
          {/* Avatar */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-700">
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user.username}</h2>
              <p className="text-gray-400">{user.email}</p>
              <p className="text-gray-500 text-sm mt-1">
                Member since {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  disabled={!isEditing || isSaving}
                  className="w-full px-4 py-3 bg-gray-800/80 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
                />
                {errors.first_name && (
                  <p className="mt-2 text-sm text-red-400">{errors.first_name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  disabled={!isEditing || isSaving}
                  className="w-full px-4 py-3 bg-gray-800/80 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
                />
                {errors.last_name && (
                  <p className="mt-2 text-sm text-red-400">{errors.last_name[0]}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing || isSaving}
                className="w-full px-4 py-3 bg-gray-800/80 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-400">{errors.email[0]}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing || isSaving}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800/80 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 resize-none"
                placeholder="Tell us about yourself..."
              />
              {errors.bio && (
                <p className="mt-2 text-sm text-red-400">{errors.bio[0]}</p>
              )}
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div className="p-3 bg-green-900/30 border border-green-700/50 rounded-xl text-green-400 text-sm">
                {saveMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              {isEditing ? (
                <>
                  <motion.button
                    onClick={handleSave}
                    disabled={isSaving}
                    whileHover={{ scale: isSaving ? 1 : 1.02 }}
                    whileTap={{ scale: isSaving ? 1 : 0.98 }}
                    className="flex-1 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </motion.button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        first_name: user?.first_name || "",
                        last_name: user?.last_name || "",
                        email: user?.email || "",
                        bio: user?.bio || "",
                      });
                      setErrors({});
                    }}
                    className="flex-1 py-3 bg-gray-800 text-gray-300 border border-gray-600 rounded-xl font-semibold hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <motion.button
                  onClick={() => setIsEditing(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg transition-all"
                >
                  Edit Profile
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
