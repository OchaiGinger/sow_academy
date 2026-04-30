export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-bg-surface border border-border-subtle rounded-sm shadow-2xl p-8">
        <div className="flex flex-col items-center mb-10">
          <div className="text-primary text-3xl font-bold tracking-tighter mb-2">AcademiaFlow</div>
          <div className="text-text-secondary text-sm">School Onboarding & Initialization</div>
        </div>
        {children}
      </div>
    </div>
  );
}
