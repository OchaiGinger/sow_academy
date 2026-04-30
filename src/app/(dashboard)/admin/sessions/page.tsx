import { getSessions } from "@/app/actions/session-action";
import { SessionList } from "./_components/session-list";
import { AddSessionButton } from "./_components/add-session-button";

export default async function AdminSessionsPage() {
  const sessions = await getSessions();

  return (
    // overflow-x-hidden is the safety net here
    <div className="max-w-6xl mx-auto py-4 px-4 md:py-8 md:px-6 space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b pb-6">
        <div className="space-y-1 min-w-0">
          {/* min-w-0 allows title to wrap if needed */}
          <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl text-foreground truncate sm:whitespace-normal">
            Academic Sessions
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-prose">
            Configure school years, terms, and grading windows.
          </p>
        </div>

        <div className="w-full sm:w-auto shrink-0">
          <AddSessionButton />
        </div>
      </div>

      <div className="w-full animate-in fade-in slide-in-from-bottom-3 duration-500">
        <SessionList initialSessions={sessions} />
      </div>
    </div>
  );
}
