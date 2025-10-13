import { useState } from 'react';
import { useUser } from '../../UserContext.jsx';
import Card from '../../components/Card.jsx';
import { User, Lock, Save, Trash2, AlertTriangle } from 'lucide-react';

export default function PatientSettings() {
  const { user } = useUser();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState({ new: false, confirm: false, current: false });
  const minLen = 6;
  const isPwValid = (val) => val.length >= minLen;

  const handleProfileSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      // TODO: Call API to update profile
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessage('Profile updated successfully');
    } catch (e) {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!isPwValid(password.new)) {
      setMessage(`New password must be at least ${minLen} characters`);
      return;
    }
    if (password.new !== password.confirm) {
      setMessage('New passwords do not match');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      // TODO: Call API to change password
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessage('Password changed successfully');
      setPassword({ current: '', new: '', confirm: '' });
    } catch (e) {
      setMessage('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setMessage('Please type DELETE to confirm');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const apiBase = (import.meta.env.VITE_LARAVEL_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
      const res = await fetch(`${apiBase}/api/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      alert('Account deleted successfully');
      localStorage.clear();
      window.location.href = '/';
    } catch (e) {
      setMessage('Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full px-6 md:px-8 lg:px-10 py-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
          <User size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Manage your account and preferences</p>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${message.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {message}
        </div>
      )}

      {/* Profile Settings */}
      <Card className="rounded-2xl bg-white shadow-md ring-1 ring-sky-100/60 px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-sky-600" />
          <h2 className="text-lg font-semibold text-slate-800">Profile Information</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>
          <button
            onClick={handleProfileSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50"
          >
            <Save size={16} />
            Save Profile
          </button>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="rounded-2xl bg-white shadow-md ring-1 ring-sky-100/60 px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={18} className="text-sky-600" />
          <h2 className="text-lg font-semibold text-slate-800">Change Password</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Password <span className="text-rose-600">*</span></label>
            <input
              type="password"
              value={password.current}
              onChange={(e) => setPassword({ ...password, current: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, current: true }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
            {touched.current && !password.current ? (
              <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">This field is required.</p>
            ) : (
              <p className="mt-1 text-[11px] leading-tight min-h-[14px] invisible">placeholder</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password <span className="text-rose-600">*</span></label>
            <input
              type="password"
              value={password.new}
              onChange={(e) => setPassword({ ...password, new: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, new: true }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
            {touched.new && !isPwValid(password.new) ? (
              <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">Password must be at least {minLen} characters.</p>
            ) : (
              <p className="mt-1 text-[11px] leading-tight min-h-[14px] invisible">placeholder</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password <span className="text-rose-600">*</span></label>
            <input
              type="password"
              value={password.confirm}
              onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
            {touched.confirm && password.confirm && password.new !== password.confirm ? (
              <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">Passwords do not match.</p>
            ) : touched.confirm && !password.confirm ? (
              <p className="mt-1 text-[11px] leading-tight text-rose-600 min-h-[14px]">This field is required.</p>
            ) : (
              <p className="mt-1 text-[11px] leading-tight min-h-[14px] invisible">placeholder</p>
            )}
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={saving || !isPwValid(password.new) || password.new !== password.confirm || !password.current}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50"
          >
            <Lock size={16} />
            Change Password
          </button>
        </div>
      </Card>

      {/* Delete Account */}
      <Card className="rounded-2xl bg-white shadow-md ring-1 ring-rose-100/60 px-6 py-5 border border-rose-200">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-rose-600" />
          <h2 className="text-lg font-semibold text-slate-800">Danger Zone</h2>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3">
            <p className="text-sm text-rose-700 font-medium mb-1">Delete Your Account</p>
            <p className="text-xs text-rose-600">
              Once you delete your account, there is no going back. All your data will be permanently removed.
            </p>
          </div>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700"
            >
              <Trash2 size={16} />
              Delete Account
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type <span className="font-bold text-rose-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  placeholder="DELETE"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={saving || deleteConfirmText !== 'DELETE'}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Confirm Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
