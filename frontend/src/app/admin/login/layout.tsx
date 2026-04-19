// This layout is intentionally empty — the login page manages its own full-page layout
// and must NOT be wrapped by the admin auth guard in /admin/layout.tsx.
// Next.js picks the closest layout.tsx, so this file prevents /admin/layout.tsx from wrapping it.

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
