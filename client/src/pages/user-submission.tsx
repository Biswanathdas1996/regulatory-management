import { useQuery } from "@tanstack/react-query";
import { UserSubmission } from "@/components/UserSubmission";
import { SubmissionHistory } from "@/components/SubmissionHistory";
import UserLayout from "@/components/UserLayout";

export default function UserSubmissionPage() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  if (!user) {
    return (
      <UserLayout
        title="Submit Template"
        subtitle="Download templates, fill them out, and submit for validation"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </UserLayout>
    );
  }

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
          <SubmissionHistory userId={user.id} />
        </div>
      </div>
    </UserLayout>
  );
}