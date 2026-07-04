import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompanySettings, updateCompanySettings } from '../../api/company.api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SettingsTabs from '../../components/layout/SettingsTabs';
import toast from 'react-hot-toast';
import { Building, Mail, Phone, MapPin, Globe, Award, Image, Loader2 } from 'lucide-react';

const companySchema = zod.object({
  companyName: zod.string().min(1, 'Company Name is required'),
  email: zod.string().email('Please enter a valid email address'),
  phone: zod.string().min(8, 'Phone must be at least 8 digits'),
  address: zod.string().min(5, 'Address must be at least 5 characters'),
  website: zod.string().optional(),
  invoicePrefix: zod.string().min(1, 'Invoice prefix is required'),
  invoiceStartNumber: zod.coerce.number().min(1, 'Start number must be at least 1'),
});

const CompanySettings = () => {
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  // Fetch Settings
  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ['companySettings'],
    queryFn: getCompanySettings,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(companySchema),
  });

  // Hydrate settings fields on fetch completion
  useEffect(() => {
    if (settingsRes?.data) {
      const c = settingsRes.data;
      reset({
        companyName: c.companyName || '',
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || '',
        website: c.website || '',
        invoicePrefix: c.invoicePrefix || 'INV',
        invoiceStartNumber: c.invoiceStartNumber || 1,
      });
      if (c.logoUrl) {
        setLogoPreview(c.logoUrl);
      }
    }
  }, [settingsRes, reset]);

  // Logo file change preview
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const mutation = useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: () => {
      toast.success('Company settings updated successfully!');
      queryClient.invalidateQueries(['companySettings']);
      queryClient.invalidateQueries(['dashboardStats']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update company settings');
    },
  });

  const onSubmit = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-light animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">System Settings</h2>
        <p className="text-slate-400 text-sm mt-1">Configure company profiles, active prefixes, and user details.</p>
      </div>

      {/* Settings Navigation Tabs */}
      <SettingsTabs />

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Logo uploader preview box */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/5">
            <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative group">
              {logoPreview ? (
                <img src={logoPreview} alt="Company Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Image className="w-8 h-8 text-slate-500" />
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Brand Logo
              </label>
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Button
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => document.getElementById('logo-upload').click()}
                  className="rounded-xl flex items-center space-x-1.5"
                >
                  <Image className="w-4 h-4" />
                  <span>Choose Image</span>
                </Button>
                {logoPreview && (
                  <Button
                    type="button"
                    variant="glass"
                    size="sm"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview('');
                    }}
                    className="rounded-xl text-rose-400 hover:text-rose-300"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-slate-500">Supports PNG, JPG, JPEG up to 2MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              {...register('companyName')}
              label="Company Name *"
              placeholder="RK Event Management"
              icon={Building}
              error={errors.companyName?.message}
            />

            <Input
              {...register('email')}
              type="email"
              label="Billing Email *"
              placeholder="billing@rkevent.com"
              icon={Mail}
              error={errors.email?.message}
            />

            <Input
              {...register('phone')}
              label="Phone Number *"
              placeholder="+91 99999 88888"
              icon={Phone}
              error={errors.phone?.message}
            />

            <Input
              {...register('website')}
              label="Website URL"
              placeholder="https://rkevent.com"
              icon={Globe}
              error={errors.website?.message}
            />
          </div>

          <Input
            {...register('address')}
            label="Company Office Address *"
            placeholder="742 Corporate Plaza, New Delhi, India"
            icon={MapPin}
            error={errors.address?.message}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/5 pt-6">
            <Input
              {...register('invoicePrefix')}
              label="Invoice Number Prefix *"
              placeholder="e.g. RKEVENT"
              icon={Award}
              error={errors.invoicePrefix?.message}
            />

            <Input
              {...register('invoiceStartNumber')}
              type="number"
              label="Invoice Start Index *"
              placeholder="1"
              icon={Award}
              error={errors.invoiceStartNumber?.message}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end pt-4 border-t border-white/5">
            <Button type="submit" isLoading={mutation.isPending}>
              Save Settings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CompanySettings;
