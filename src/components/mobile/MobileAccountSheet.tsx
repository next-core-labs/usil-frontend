import React from 'react';
import { ClipboardList, LayoutDashboard, LogOut, MailCheck } from 'lucide-react';
import { Button, Modal } from '../ui';
import { roleLabelAr } from '../../contracts/auth/roles';
import { UserProfile } from '../../types';

interface MobileAccountSheetProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile;
  onOpenOrders: () => void;
  /** Omitted for clients, who have no dashboard to go to. */
  onOpenDashboard?: () => void;
  onVerifyEmail: () => void;
  onLogout: () => void;
}

/**
 * What the bottom bar's «حسابي» opens once someone is signed in. It used to
 * open the login/register screen regardless, so a signed-in user tapping
 * their own account was asked to sign in again.
 */
export const MobileAccountSheet: React.FC<MobileAccountSheetProps> = ({
  open,
  onClose,
  user,
  onOpenOrders,
  onOpenDashboard,
  onVerifyEmail,
  onLogout,
}) => {
  // Close first so the next screen is not stacked under this one.
  const then = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <Modal open={open} onClose={onClose} title="حسابي" size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {user.avatarUrl || user.avatar ? (
            <img
              src={user.avatarUrl || user.avatar}
              alt=""
              className="w-12 h-12 rounded-control object-cover bg-navy"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-control bg-navy text-sand flex items-center justify-center text-lg font-bold"
              aria-hidden
            >
              {(user.name || 'ي').trim()[0] || 'ي'}
            </div>
          )}
          <div className="min-w-0 text-right">
            <p className="font-semibold text-ink truncate">{user.name}</p>
            <p className="text-xs text-slate-500">{roleLabelAr(user.role)}</p>
            {user.email ? (
              <p className="text-xs text-slate-500 truncate" dir="ltr">
                {user.email}
              </p>
            ) : null}
            {user.phone ? (
              <p className="text-xs text-slate-500" dir="ltr">
                {user.phone}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2">
          {user.emailVerified === false ? (
            <Button variant="primary" icon={MailCheck} onClick={then(onVerifyEmail)}>
              تأكيد البريد الإلكتروني
            </Button>
          ) : null}
          <Button icon={ClipboardList} onClick={then(onOpenOrders)}>
            طلباتي ومتابعتها
          </Button>
          {onOpenDashboard ? (
            <Button variant="navy" icon={LayoutDashboard} onClick={then(onOpenDashboard)}>
              لوحة التحكم
            </Button>
          ) : null}
          <Button variant="danger" icon={LogOut} onClick={then(onLogout)}>
            تسجيل الخروج
          </Button>
        </div>
      </div>
    </Modal>
  );
};
