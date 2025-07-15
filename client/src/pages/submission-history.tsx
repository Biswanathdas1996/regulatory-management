import { useQuery } from "@tanstack/react-query";
import { SubmissionHistory } from "@/components/SubmissionHistory";
import UserLayout from "@/components/UserLayout";

export default function SubmissionHistoryPage() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  if (!user) {
    return (
      <UserLayout
        title="Submission History"
        subtitle="View and manage all your template submissions"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout 
      title="Submission History" 
      subtitle="View and manage all your template submissions"
    >
      <SubmissionHistory userId={user.id} />
    </UserLayout>
  );
}