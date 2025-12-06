import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import type { Staff, StaffInput } from '../../types/Staff';

export type AddStaffModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: StaffInput) => Promise<void>;
  existingStaff?: Staff[];
};

type FormState = StaffInput & { confirmPassword: string };

const EMPTY_FORM: FormState = {
  fullName: '',
  username: '',
  password: '',
  email: '',
  phoneNumber: '',
  role: 'Staff',
  confirmPassword: '',
};

const AddStaffModal = ({ open, onClose, onSave, existingStaff }: AddStaffModalProps) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const existingUsernames = useMemo(() => new Set(existingStaff?.map((staff) => staff.username.toLowerCase())), [existingStaff]);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setError(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((previous: FormState) => ({ ...previous, [field]: value }));
  };

  const validateForm = () => {
    if (!form.fullName.trim()) {
      setError('Full name is required.');
      return false;
    }

    if (!form.username.trim()) {
      setError('Username is required.');
      return false;
    }

    if (existingUsernames.has(form.username.toLowerCase())) {
      setError('This username is already taken.');
      return false;
    }

  if (!form.email.trim() || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u.test(form.email)) {
      setError('Enter a valid email address.');
      return false;
    }

    if (!form.password) {
      setError('Password is required.');
      return false;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim(),
        phoneNumber: form.phoneNumber?.trim() || undefined,
        role: 'Staff',
      });
      setForm(EMPTY_FORM);
      onClose();
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message || 'Unable to add staff.');
      } else {
        setError('Unable to add staff.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8 backdrop-blur">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add Staff Member</h2>
            <p className="text-sm text-brand-muted">Create a new staff account with login access.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-brand-background p-2 text-brand-muted transition hover:text-brand-primary"
            aria-label="Close add staff modal"
            disabled={saving}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        ) : null}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Full name
            <input
              value={form.fullName}
              onChange={(event) => handleChange('fullName', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/20"
              placeholder="e.g. Maria dela Cruz"
              disabled={saving}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Username
            <input
              value={form.username}
              onChange={(event) => handleChange('username', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-brand-primary/20"
              placeholder="unique username"
              disabled={saving}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => handleChange('email', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-brand-primary/20"
              placeholder="name@example.com"
              disabled={saving}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Phone (optional)
            <input
              value={form.phoneNumber}
              onChange={(event) => handleChange('phoneNumber', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-brand-primary/20"
              placeholder="e.g. 0917 123 4567"
              disabled={saving}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Password
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => handleChange('password', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-brand-primary/20"
                placeholder="Minimum 8 characters"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-500"
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Confirm password
            <div className="relative mt-2">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(event) => handleChange('confirmPassword', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-brand-primary/20"
                placeholder="Re-enter password"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-500"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            className="rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/30 transition hover:brightness-105 disabled:opacity-75"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Staff'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStaffModal;
