'use client';
import { useLocale } from '@/lib/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AccountTab from '../components/AccountTab';

export default function AccountPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  return (
    <DashboardLayout role="tutor">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1A1A2E', letterSpacing: '-0.02em' }}>
          💼 {isAr ? 'حسابي' : 'My Account'}
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: 4 }}>
          {isAr ? 'أدر معلوماتك الشخصية وفواتيرك ومدفوعاتك' : 'Manage your personal info, invoices and payouts'}
        </p>
      </div>
      <AccountTab isAr={isAr} />
    </DashboardLayout>
  );
}
