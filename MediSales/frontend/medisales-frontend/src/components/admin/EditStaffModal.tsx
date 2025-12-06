import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Staff, StaffUpdateInput } from '../../types/Staff';
import type { UserRole } from '../../types/User';

export type EditStaffModalProps = {
  open: boolean;
  staff: Staff | null;
  onClose: () => void;
  onSave: (staffId: number, payload: StaffUpdateInput) => Promise<void>;
};

const ROLE_OPTIONS: UserRole[] = ['Administrator', 'Staff'];

const EditStaffModal = ({ open, staff, onClose, onSave }: EditStaffModalProps) => {
  const [form, setForm] = useState<StaffUpdateInput>({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'Staff',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && staff) {
      setForm({
        fullName: staff.fullName,
        email: staff.email,
        phoneNumber: staff.phoneNumber ?? '',
        role: staff.role,
      });
      setError(null);
      setSaving(false);
    }
  }, [open, staff]);

  if (!open || !staff) {
    return null;
  }

  const handleChange = (field: keyof StaffUpdateInput, value: string | UserRole) => {
    setForm((previous: StaffUpdateInput) => ({ ...previous, [field]: value }));
  };

  const validateForm = () => {
    if (!form.fullName.trim()) {
      setError('Full name is required.');
      return false;
    }

    if (!form.email.trim() || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/u.test(form.email)) {
      setError('Enter a valid email address.');
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
      await onSave(staff.userId, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber?.trim() || undefined,
        role: form.role,
      });
      onClose();
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message || 'Unable to update staff member.');
      } else {
        setError('Unable to update staff member.');
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
            <h2 className="text-lg font-semibold text-slate-900">Edit Staff Member</h2>
            <p className="text-sm text-brand-muted">Update contact information and role assignments.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-brand-background p-2 text-brand-muted transition hover:text-brand-primary"
            aria-label="Close edit staff modal"
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
              placeholder="e.g. Juan Santos"
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
              value={form.phoneNumber ?? ''}
              onChange={(event) => handleChange('phoneNumber', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-brand-primary/20"
              placeholder="e.g. 0917 123 4567"
              disabled={saving}
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Role
            <select
              value={form.role}
              onChange={(event) => handleChange('role', event.target.value as UserRole)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-brand-primary/20"
              disabled={saving}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
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
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStaffModal;
