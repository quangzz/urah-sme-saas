"use client";

import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/Button";

export function Step1Name() {
  const { data, updateData, nextStep } = useOnboarding();

  const handleNext = () => {
    if (data.businessName.trim().length > 0) {
      nextStep();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto w-full">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-center tracking-tight text-balance">
        Let&apos;s start with your <span className="text-primary italic">Business Name</span>
      </h1>
      <p className="text-muted-foreground text-center mb-12 text-lg">
        This is the name that will appear on your generated logos.
      </p>

      <div className="w-full space-y-6">
        <div>
          <input
            type="text"
            className="w-full text-2xl px-4 py-4 bg-transparent border-b-2 border-border focus:border-primary outline-none transition-colors text-center"
            placeholder="My Cool Startup"
            value={data.businessName}
            onChange={(e) => updateData({ businessName: e.target.value })}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNext();
            }}
          />
        </div>
        <div>
          <input
            type="text"
            className="w-full text-lg px-4 py-3 bg-transparent border-b border-border/50 focus:border-primary/50 outline-none transition-colors text-center text-muted-foreground"
            placeholder="Add a slogan (optional)"
            value={data.slogan}
            onChange={(e) => updateData({ slogan: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNext();
            }}
          />
        </div>
        
        <div className="pt-8 flex justify-center">
          <Button 
            size="lg" 
            className="px-12 rounded-full text-lg shadow-lg hover:shadow-primary/25 transition-all"
            disabled={!data.businessName.trim()}
            onClick={handleNext}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
