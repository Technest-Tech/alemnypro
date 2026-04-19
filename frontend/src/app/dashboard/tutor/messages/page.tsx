'use client';
import { useLocale } from '@/lib/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MessagesTab from '../components/MessagesTab';

export default function MessagesPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  return (
    <DashboardLayout role="tutor">
      {/* Page title */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 900, color: '#1A1A2E', letterSpacing: '-0.02em', margin: 0 }}>
          {isAr ? '💬 مركز الرسائل' : '💬 Message Center'}
        </h1>
        <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', marginTop: 4 }}>
          {isAr
            ? 'تواصل مع طلابك، أدر طلبات الحجز والجدولة والمدفوعات من مكان واحد'
            : 'Communicate with students and manage bookings, scheduling, and payments in one place'}
        </p>
      </div>

      <MessagesTab isAr={isAr} />
    </DashboardLayout>
  );
}
