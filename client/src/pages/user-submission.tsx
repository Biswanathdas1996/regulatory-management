import { UserSubmission } from "@/components/UserSubmission";
import { SubmissionHistory } from "@/components/SubmissionHistory";
import { User } from "lucide-react";

export default function UserSubmissionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submit Template</h1>
              <p className="text-gray-600 mt-2">
                Download templates, fill them out, and submit for validation
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">User Portal</span>
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-white text-sm" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <UserSubmission />
            </div>
            <div>
              <SubmissionHistory userId={1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}