import { OnboardingProvider } from "@/context/OnboardingContext";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <OnboardingProvider>
        {children}
      </OnboardingProvider>
    </div>
  );
}
