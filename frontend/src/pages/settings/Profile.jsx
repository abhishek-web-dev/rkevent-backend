import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile, changePassword } from '../../api/auth.api';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SettingsTabs from '../../components/layout/SettingsTabs';
import toast from 'react-hot-toast';
import { User, Mail, Lock, ShieldAlert } from 'lucide-react';

const profileSchema = zod.object({
  name: zod.string().min(1, 'Name is required'),
  email: zod.string().email('Please enter a valid email address'),
});

const passwordSchema = zod
  .object({
    currentPassword: zod.string().min(6, 'Current password is required (min 6 characters)'),
    newPassword: zod.string().min(6, 'New password must be at least 6 characters long'),
    confirmPassword: zod.string().min(6, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const Profile = () => {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();

  // 1. Profile Details Form Setup
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name,
        email: user.email,
      });
    }
  }, [user, resetProfile]);

  // 2. Change Password Form Setup
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  // Profile details update mutation
  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      toast.success('Profile details updated successfully!');
      setUser(res.data);
      // Persist in local storage
      localStorage.setItem('rk_user', JSON.stringify(res.data));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    },
  });

  // Password update mutation
  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully!');
      resetPassword();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to change password');
    },
  });

  const onProfileSubmit = (data) => {
    profileMutation.mutate(data);
  };

  const onPasswordSubmit = (data) => {
    passwordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">System Settings</h2>
        <p className="text-slate-400 text-sm mt-1">Configure company profiles, active prefixes, and user details.</p>
      </div>

      <SettingsTabs />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details Profile Card */}
        <Card className="flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2 pb-3 border-b border-white/5">
              <User className="w-5 h-5 text-brand-light" />
              <span>Personal Details</span>
            </h3>

            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
              <Input
                {...registerProfile('name')}
                label="Full Name *"
                placeholder="RK Staff member"
                icon={User}
                error={profileErrors.name?.message}
              />

              <Input
                {...registerProfile('email')}
                type="email"
                label="Email Address *"
                placeholder="staff@rkevent.com"
                icon={Mail}
                error={profileErrors.email?.message}
              />

              <div className="flex justify-end pt-4 border-t border-white/5 mt-6">
                <Button type="submit" isLoading={profileMutation.isPending}>
                  Update Profile
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card className="flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2 pb-3 border-b border-white/5">
              <Lock className="w-5 h-5 text-brand-light" />
              <span>Change Password</span>
            </h3>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5">
              <Input
                {...registerPassword('currentPassword')}
                type="password"
                label="Current Password *"
                placeholder="••••••••"
                icon={Lock}
                error={passwordErrors.currentPassword?.message}
              />

              <Input
                {...registerPassword('newPassword')}
                type="password"
                label="New Password *"
                placeholder="••••••••"
                icon={Lock}
                error={passwordErrors.newPassword?.message}
              />

              <Input
                {...registerPassword('confirmPassword')}
                type="password"
                label="Confirm New Password *"
                placeholder="••••••••"
                icon={Lock}
                error={passwordErrors.confirmPassword?.message}
              />

              <div className="flex justify-end pt-4 border-t border-white/5 mt-6">
                <Button type="submit" isLoading={passwordMutation.isPending}>
                  Change Password
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
