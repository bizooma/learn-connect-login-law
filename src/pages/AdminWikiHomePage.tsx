import ReportsShell from "@/components/admin/wiki/reports/ReportsShell";
import TeamPulse from "@/components/admin/wiki/home/TeamPulse";
import InsightsCards from "@/components/admin/wiki/home/InsightsCards";
import CompletionsList from "@/components/admin/wiki/home/CompletionsList";
import ContentYouOwn from "@/components/admin/wiki/home/ContentYouOwn";
import WikiStreakCard from "@/components/admin/wiki/home/WikiStreakCard";

const AdminWikiHomePage = () => {
  return (
    <ReportsShell title="Home" subtitle="Your Policies & Procedures dashboard">
      <div className="space-y-6">
        <WikiStreakCard />
        <TeamPulse />
        <InsightsCards />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CompletionsList />
          <ContentYouOwn />
        </div>
      </div>
    </ReportsShell>
  );
};

export default AdminWikiHomePage;
