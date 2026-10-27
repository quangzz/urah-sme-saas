"use client";

import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/Button";

const industries = [
  "Restaurant", "Consulting", "Technology", "Beauty & Spa", 
  "Real Estate", "Photography", "Education", "Healthcare", "Retail", "Fitness"
];

export function Step2Industry() {
  const { data, updateData, nextStep } = useOnboarding();

  const handleSelect = (ind: string) => {
    updateData({ industry: ind });
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-3 text-center tracking-tight">Pick your industry</h2>
      <p className="text-muted-foreground text-center mb-10">We&apos;ll tailor designs specifically for your niche.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-10">
        {industries.map((ind) => {
          const isSelected = data.industry === ind;
          return (
            <div 
              key={ind}
              onClick={() => handleSelect(ind)}
              className={`p-4 rounded-xl border text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${isSelected ? 'border-primary bg-primary/10 text-primary font-medium' : 'bg-card text-card-foreground border-border hover:border-primary/50'}`}
            >
              {ind}
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-lg mx-auto mb-10">
        <label className="block text-sm font-medium text-muted-foreground mb-2 text-center">
          Who is your target audience? (Optional)
        </label>
        <input
          type="text"
          className="w-full text-lg px-4 py-3 bg-transparent border border-border rounded-xl focus:border-primary outline-none transition-colors"
          placeholder="e.g., Young professionals, families, local businesses..."
          value={data.targetAudience}
          onChange={(e) => updateData({ targetAudience: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && data.industry) nextStep();
          }}
        />
      </div>

      <div className="flex justify-center">
        <Button 
          size="lg" 
          className="px-12 rounded-full text-lg shadow-lg"
          disabled={!data.industry}
          onClick={nextStep}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
