import AdminLayout from "@/components/AdminLayout";
import { SubmissionHistory } from "@/components/SubmissionHistory";

export default function AdminSubmissionsPage() {
  return (
    <AdminLayout 
      title="All Submissions" 
      subtitle="View and manage all user submissions across the system"
    >
      <SubmissionHistory showAllSubmissions={true} />
    </AdminLayout>
  );
}