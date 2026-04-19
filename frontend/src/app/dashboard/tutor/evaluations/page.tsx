'use client';
import { useLocale } from '@/lib/locale';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EvaluationsTab from '../components/EvaluationsTab';
import styles from '../../dashboard.module.css';

export default function EvaluationsPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  return (
    <DashboardLayout role="tutor">
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            ⭐ {isAr ? 'التقييمات والتوصيات' : 'Evaluations & Reviews'}
          </h1>
          <p className={styles.pageSubtitle}>
            {isAr
              ? 'راجع تقييمات طلابك واطلب توصيات لتعزيز ملفك'
              : 'Review student feedback and request recommendations to boost your profile'}
          </p>
        </div>
      </div>
      <EvaluationsTab isAr={isAr} />
    </DashboardLayout>
  );
}
