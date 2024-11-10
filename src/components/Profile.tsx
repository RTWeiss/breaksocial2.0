import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProfile, createOrUpdateProfile } from '../lib/auth';
import { useAuth } from '../hooks/useAuth';
import type { Database } from '../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: '',
  });

  useEffect(() => {
    async function loadProfile() {
      if (!id) return;
      
      const profileData = await getProfile(id);
      
      if (!profileData && user?.id === id) {
        // Create profile for new users
        const newProfile = await createOrUpdateProfile(id, {
          username: `user_${id.slice(0, 8)}`,
          full_name: user.email?.split('@')[0] || 'New User',
          bio: '',
          avatar_url: '',
        });
        setProfile(newProfile);
      } else {
        setProfile(profileData);
      }
    }

    loadProfile();
  }, [id, user]);

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username,
        full_name: profile.full_name,
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const updatedProfile = await createOrUpdateProfile(id, formData);
    if (updatedProfile) {
      setProfile(updatedProfile);
      setIsEditing(false);
    }
  };

  if (!profile) {
    return <div className="p-4">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {isEditing && user?.id === id ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Avatar URL</label>
            <input
              type="text"
              value={formData.avatar_url}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {profile.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="h-16 w-16 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                <p className="text-gray-600">@{profile.username}</p>
              </div>
            </div>
            {user?.id === id && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Edit Profile
              </button>
            )}
          </div>
          {profile.bio && (
            <div className="mt-4">
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}