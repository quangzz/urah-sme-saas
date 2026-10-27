"use client";

import { useOnboarding } from "@/context/OnboardingContext";
import { Step1Name } from "@/components/features/onboarding/Step1Name";
import { Step2Industry } from "@/components/features/onboarding/Step2Industry";
import { Step3Style } from "@/components/features/onboarding/Step3Style";
import { Step4Loading } from "@/components/features/onboarding/Step4Loading";
import { Step5Preview } from "@/components/features/onboarding/Step5Preview";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function OnboardingPage() {
  const { currentStep, prevStep } = useOnboarding();
  const { user } = useAuth(); // just to check if auth is already there

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Name />;
      case 2: return <Step2Industry />;
      case 3: return <Step3Style />;
      case 4: return <Step4Loading />;
      case 5: return <Step5Preview />;
      default: return <Step1Name />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Onboarding Header Navigation */}
      <header className="h-16 flex items-center justify-between px-6 border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center">
           {currentStep > 1 && currentStep < 4 && (
             <button onClick={prevStep} className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-4">
               <ChevronLeft size={16} className="mr-1" />
               Back
             </button>
           )}
           <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
             <img src="/logo.png" alt="URAH" className="h-[40px] w-auto object-contain" />
           </Link>
        </div>

        {/* Progress Dots (only show for input steps) */}
        {currentStep < 4 && (
          <div className="flex gap-2">
             {[1, 2, 3].map(step => (
               <div key={step} className={`w-2 h-2 rounded-full transition-colors ${currentStep >= step ? 'bg-primary' : 'bg-border'}`}></div>
             ))}
          </div>
        )}

        <div className="flex items-center text-sm font-medium">
          {(!user && currentStep < 4) ? (
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
          ) : (
             <div className="w-16"></div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 bg-accent/5">
        {renderStep()}
      </main>
    </div>
  );
}
