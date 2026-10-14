'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { IconPill } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { roleLabels, users } from '@/mock';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async (name: string) => {
    setError('');
    setLoading(true);
    try {
      const data = await api.auth.login({ username: name });
      if (data.success && data.user && data.token) {
        login(data.user, data.token);
        toast.success(`ยินดีต้อนรับ ${data.user.name}`);
        router.push('/');
      } else {
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-zinc-900">
        <div className="flex items-center gap-2.5 relative z-10">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <IconPill size={18} className="text-white" />
          </span>
          <span className="text-white font-bold text-lg tracking-tight">
            Acc-Pharm
          </span>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
            ระบบประเมินร้านยาคุณภาพ
          </h2>
          <p className="mt-4 text-zinc-400 text-base leading-relaxed">
            ยื่นคำขอรับรอง ติดตามสถานะ และจัดการการตรวจประเมินร้านยา
            ได้ในที่เดียว
          </p>
        </div>
        <p className="text-zinc-500 text-xs relative z-10">
          สำนักงานรับรองร้านยาคุณภาพ สภาเภสัชกรรม
        </p>
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{
            background: 'radial-gradient(circle, #0e6b45, transparent 70%)',
          }}
        />
      </div>

      <div className="flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-12 lg:hidden">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <IconPill size={16} className="text-white" />
            </span>
            <span className="font-bold text-zinc-900 tracking-tight">
              Acc-Pharm
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            เข้าสู่ระบบ
          </h1>
          <p className="text-zinc-500 text-sm mt-1.5 mb-8">
            ใช้ชื่อผู้ใช้ หรือเลขที่ใบอนุญาต ขย.5
          </p>

          {error && (
            <div
              role="alert"
              className="mb-6 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              signIn(username);
            }}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="username"
                className="block text-[13px] font-semibold text-zinc-700 mb-1.5"
              >
                ชื่อผู้ใช้
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="เช่น pharm001"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-[13px] font-semibold text-zinc-700 mb-1.5"
              >
                รหัสผ่าน
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="ไม่ต้องกรอกใน PoC"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary !py-3"
            >
              {loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="mt-8 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-[11px] font-semibold text-amber-700 tracking-wide mb-2">
              บัญชีทดลอง (PoC)
            </p>
            <div className="grid gap-1.5">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => signIn(u.username)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] bg-white border border-amber-100 hover:border-amber-300"
                >
                  <span className="font-medium text-zinc-700">
                    {roleLabels[u.role]}
                  </span>
                  <span className="font-mono text-zinc-500">{u.username}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
