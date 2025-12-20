import TopBar from "./(workspace)/components/top-bar";
import InboxWorkspace from "./(workspace)/inbox-workspace";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <TopBar />
      <InboxWorkspace />
    </div>
  );
}
