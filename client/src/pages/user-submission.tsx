import { UserSubmission } from "@/components/UserSubmission";
import { SubmissionHistory } from "@/components/SubmissionHistory";
import UserLayout from "@/components/UserLayout";

export default function UserSubmissionPage() {
  return (
    <UserLayout 
      title="Submit Template" 
      subtitle="Download templates, fill them out, and submit for validation"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <UserSubmission />
        </div>
        <div>
          <SubmissionHistory userId={1} />
        </div>
      </div>
    </UserLayout>
  );
}