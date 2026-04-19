'use client';

import styles from './TutorDashboardTabs.module.css';

export type TabId = 'dashboard' | 'messages' | 'listings' | 'evaluations' | 'account' | 'premium';

export interface TabDef {
  id: TabId;
  icon: string;
  labelAr: string;
  labelEn: string;
  badge?: number;
  premium?: boolean;
}

interface Props {
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
  isAr: boolean;
  pendingCount?: number;
}

const TABS: TabDef[] = [
  { id: 'dashboard',   icon: '📊', labelAr: 'الرئيسية',     labelEn: 'Dashboard'   },
  { id: 'messages',    icon: '💬', labelAr: 'رسائلي',        labelEn: 'Messages'    },
  { id: 'listings',    icon: '🏷️', labelAr: 'إعلاناتي',     labelEn: 'My Listings' },
  { id: 'evaluations', icon: '⭐', labelAr: 'التقييمات',     labelEn: 'Evaluations' },
  { id: 'account',     icon: '💼', labelAr: 'حسابي',         labelEn: 'My Account'  },
  { id: 'premium',     icon: '⚡', labelAr: 'بريميوم',       labelEn: 'Premium', premium: true },
];

export default function TutorDashboardTabs({ activeTab, onTabChange, isAr, pendingCount = 0 }: Props) {
  return (
    <div className={styles.tabsWrapper} role="tablist" aria-label={isAr ? 'قوائم لوحة التحكم' : 'Dashboard navigation'}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const badge = tab.id === 'messages' && pendingCount > 0 ? pendingCount : undefined;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''} ${isActive ? styles.tabActiveGlow : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{isAr ? tab.labelAr : tab.labelEn}</span>
            {badge !== undefined && (
              <span className={styles.tabBadge}>{badge}</span>
            )}
            {tab.premium && !isActive && (
              <span className={styles.tabPremiumDot} />
            )}
          </button>
        );
      })}
    </div>
  );
}
