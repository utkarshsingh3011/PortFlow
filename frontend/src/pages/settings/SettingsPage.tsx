import { FC, useState, useEffect } from 'react';
import { Shield, Bell, Check } from 'lucide-react';
import { Card, Button, Input } from '@/components/common';
import { Toast } from '@/components/feedback';
import { useAuth } from '@/hooks';
import { userService } from '@/services/userService';

export const SettingsPage: FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [email] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setCompanyName(user.company_name || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.updateProfile({
        full_name: fullName,
        company_name: companyName,
      });
      await refreshUserProfile();
      setToast({ message: 'Profile settings saved successfully', type: 'success' });
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to update profile';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Portal Settings</h1>
        <p className="text-sm text-gray-500">
          Manage your profile details, portal preferences, and security settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* User Profile Card */}
        <Card title="Broker Profile" subtitle="Your broker account information and company details">
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-14 w-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xl border-2 border-brand-200">
                {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900">
                  {user?.full_name || 'Portal User'}
                </h4>
                {user?.company_name && (
                  <p className="text-xs font-semibold text-brand-600">{user.company_name}</p>
                )}
                <p className="text-xs text-gray-500">{user?.email || 'user@portflow.com'}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                  Active Account
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
              <Input
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Brokerage / Company Name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                value={email}
                disabled
                helperText="Email address cannot be changed directly"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" size="md" isLoading={saving}>
                <Check className="h-4 w-4 mr-1.5" /> Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Security & Access */}
        <Card title="Security & API Environment" subtitle="System integration parameters">
          <div className="space-y-4 pt-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-brand-600" />
                <div>
                  <h5 className="font-semibold text-gray-900 text-sm">Authentication Session</h5>
                  <p className="text-gray-500">JWT Bearer Token active in secure storage</p>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-mono text-[10px]">
                AUTHENTICATED
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-indigo-600" />
                <div>
                  <h5 className="font-semibold text-gray-900 text-sm">API Base URL</h5>
                  <p className="text-gray-500 font-mono">http://localhost:8000/api/v1</p>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 font-mono text-[10px]">
                CONNECTED
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
