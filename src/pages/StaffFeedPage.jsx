import StaffFeed from "../components/StaffFeed";
import { PageHeader } from "../components/ui";

export default function StaffFeedPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Department feeds"
        description="All Course Rep posts across faculties and departments. Newest first."
      />
      <StaffFeed compact={false} maxItems={80} />
    </div>
  );
}
