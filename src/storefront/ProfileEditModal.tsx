import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { cn } from '../components/ui/cn';
import type { SessionUser } from '../LoginScreen';
import type { UserProfile } from '../types';
import { useLang } from './lang';

const inputCls =
  'h-[46px] px-3.5 rounded-control border border-navy-300 bg-surface text-[15px] text-navy outline-none focus:border-action focus:ring-4 focus:ring-action/10 w-full';

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

async function send(url: string, method: string, body: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string; user?: SessionUser };
  if (!res.ok || !data.success || !data.user) throw new Error(data.error || '');
  return data.user;
}

/** The signed-in person edits their name, mobile, photo and password (PATCH /api/auth/me). */
export function ProfileEditModal({
  open,
  onClose,
  user,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  user: UserProfile;
  onSaved: (user: SessionUser) => void;
}) {
  const { L } = useLang();
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [avatar, setAvatar] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setAvatar('');
    setCurrentPassword('');
    setNewPassword('');
    setError(null);
  }, [open, user.name, user.phone]);

  const pickAvatar = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError(L('الصيغة غير مدعومة — ارفع صورة jpg أو png أو webp.', 'Use a jpg, png or webp image.'));
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError(L('حجم الصورة كبير — الحد الأقصى 2 ميغابايت.', 'The image is too large (2 MB max).'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    if (newPassword && !currentPassword) {
      setError(L('اكتب الرقم السري الحالي لتغييره.', 'Enter your current password to change it.'));
      return;
    }
    setBusy(true);
    try {
      let saved = await send('/api/auth/me', 'PATCH', {
        name,
        phone,
        ...(newPassword ? { currentPassword, newPassword } : {}),
      });
      if (avatar) saved = await send('/api/auth/avatar', 'POST', { avatarDataUrl: avatar });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError((err as Error).message || L('تعذر حفظ التعديلات. حاول مرة أخرى.', 'Could not save. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const shown = avatar || user.avatarUrl || user.avatar;

  return (
    <Modal open={open} onClose={onClose} title={L('تعديل الملف الشخصي', 'Edit profile')} size="sm" dismissOnBackdrop={!busy}>
      <form onSubmit={save} className="space-y-3.5">
        <label className="flex items-center gap-3 cursor-pointer w-fit">
          {shown ? (
            <img src={shown} alt="" className="w-16 h-16 rounded-card object-cover bg-action" />
          ) : (
            <span className="w-16 h-16 rounded-card bg-action text-white grid place-items-center text-[26px] font-bold" aria-hidden>
              {(name || 'ي').trim()[0]}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-action">
            <Camera className="w-4 h-4" aria-hidden />
            {L('تغيير الصورة', 'Change photo')}
          </span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickAvatar(e.target.files?.[0])} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          {L('الاسم', 'Name')}
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className={inputCls} autoComplete="name" />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          {L('رقم الجوال (اختياري)', 'Mobile (optional)')}
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            placeholder="05XXXXXXXX"
            className={cn(inputCls, 'text-start tnum')}
          />
        </label>
        <div className="text-[13px] text-ink-3 pt-1">{L('تغيير الرقم السري (اختياري)', 'Change password (optional)')}</div>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={L('الرقم السري الحالي', 'Current password')}
          autoComplete="current-password"
          className={inputCls}
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={L('الرقم السري الجديد (8 خانات أو أكثر)', 'New password (8+ characters)')}
          autoComplete="new-password"
          minLength={newPassword ? 8 : undefined}
          className={inputCls}
        />
        {error ? (
          <p role="alert" className="text-sm text-danger font-medium">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2.5 pt-1">
          <button type="submit" disabled={busy} className="h-11 px-5 rounded-control bg-action text-white text-sm font-semibold disabled:opacity-70">
            {busy ? L('جارٍ الحفظ…', 'Saving…') : L('حفظ', 'Save')}
          </button>
          <button type="button" onClick={onClose} disabled={busy} className="h-11 px-5 rounded-control border border-navy-300 text-navy text-sm font-semibold">
            {L('إلغاء', 'Cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
