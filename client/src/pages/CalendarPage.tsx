import { SubmissionCalendar } from '@/components/SubmissionCalendar';
import { UserLayout } from '@/components/UserLayout';

export function CalendarPage() {
  return (
    <UserLayout title="Submission Calendar" showSidebar={true}>
      <div className="max-w-7xl mx-auto">
        <SubmissionCalendar />
      </div>
    </UserLayout>
  );
}