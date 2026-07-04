import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useMutation } from '@tanstack/react-query';
import { createCustomer } from '../../api/customer.api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Building, Mail, Phone, MapPin, AlignLeft, ArrowLeft } from 'lucide-react';

const customerSchema = zod.object({
  name: zod.string().min(1, 'Name is required'),
  companyName: zod.string().optional(),
  email: zod.string().email('Please enter a valid email address'),
  phone: zod.string().min(8, 'Phone number must be at least 8 digits'),
  address: zod.string().min(5, 'Address must be at least 5 characters long'),
  notes: zod.string().optional(),
});

const AddCustomer = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', companyName: '', email: '', phone: '', address: '', notes: '' },
  });

  const mutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      toast.success('Customer registered successfully!');
      navigate('/customers');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to register customer');
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header and back button */}
      <div className="flex items-center space-x-3 mb-2">
        <Link to="/customers" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4.5 h-4.5" />
        </Link>
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Add Customer</h2>
          <p className="text-slate-400 text-sm mt-1">Register a new client profile.</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              {...register('name')}
              label="Contact Name *"
              placeholder="Jane Doe"
              icon={User}
              error={errors.name?.message}
            />

            <Input
              {...register('companyName')}
              label="Company Name"
              placeholder="Doe Events LLC"
              icon={Building}
              error={errors.companyName?.message}
            />

            <Input
              {...register('email')}
              type="email"
              label="Email Address *"
              placeholder="jane@doe.com"
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
          </div>

          <Input
            {...register('address')}
            label="Billing Address *"
            placeholder="123 Corporate Square, Block-C, Connaught Place, New Delhi"
            icon={MapPin}
            error={errors.address?.message}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Notes & Special Instructions
            </label>
            <div className="relative">
              <span className="absolute top-3 left-3.5 text-slate-400">
                <AlignLeft className="w-4 h-4" />
              </span>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Preferred delivery timings or direct billing configurations..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-white text-sm outline-none placeholder:text-slate-500 resize-none"
              />
            </div>
            {errors.notes && (
              <p className="text-rose-500 text-xs font-medium mt-1">{errors.notes.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
            <Link to="/customers">
              <Button variant="secondary" disabled={mutation.isPending}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={mutation.isPending}>
              Register Customer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddCustomer;
