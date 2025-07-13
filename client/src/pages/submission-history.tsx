import { SubmissionHistory } from "@/components/SubmissionHistory";
import UserLayout from "@/components/UserLayout";

export default function SubmissionHistoryPage() {
  return (
    <UserLayout 
      title="Submission History" 
      subtitle="View and manage all your template submissions"
    >
      <SubmissionHistory userId={1} />
    </UserLayout>
  );
}