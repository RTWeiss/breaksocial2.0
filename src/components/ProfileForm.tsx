import React from 'react';
import { useForm } from 'react-hook-form';
import { Camera } from 'lucide-react';
import { Profile } from '../types';

interface ProfileFormProps {
  profile: Profile;
  onSubmit: (data: Partial<Profile>) => Promise<void>;
  onCancel: () => void;
}

export default function ProfileForm({ profile, onSubmit, onCancel }: ProfileFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      username: profile.username,
      full_name: profile.full_name || '',
      bio: profile.bio || '',
      avatar_url: profile.avatar_url || '',
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400">Username</label>
        <input
          {...register('username', { required: 'Username is required' })}
          className="mt-1 block w-full rounded-lg bg-gray-900 border border-gray-800 text-white px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400">Full Name</label>
        <input
          {...register('full_name')}
          className="mt-1 block w-full rounded-lg bg-gray-900 border border-gray-800 text-white px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400">Bio</label>
        <textarea
          {...register('bio')}
          className="mt-1 block w-full rounded-lg bg-gray-900 border border-gray-800 text-white px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400">Avatar URL</label>
        <div className="mt-1 flex items-center space-x-4">
          <input
            {...register('avatar_url')}
            className="block w-full rounded-lg bg-gray-900 border border-gray-800 text-white px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <div className="flex-shrink-0">
            <img
              src={profile.avatar_url || `https://api.dicebear.com/7.x/avatars/svg?seed=${profile.username}`}
              alt="Avatar preview"
              className="w-10 h-10 rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
        >
          Save Profile
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}