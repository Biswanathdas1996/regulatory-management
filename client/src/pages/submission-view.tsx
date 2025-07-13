import SubmissionView from "@/components/SubmissionView";
import UserLayout from "@/components/UserLayout";

export default function SubmissionViewPage() {
  return (
    <UserLayout
      title="Submission Details"
      subtitle="View your submission and validation results"
    >
      <SubmissionView />
    </UserLayout>
  );
}
