import { redirect } from 'next/navigation';

/** /dashboard/tutor/bookings — removed; redirect to Sessions */
export default function TutorBookingsRedirect() {
  redirect('/dashboard/tutor/sessions');
}
