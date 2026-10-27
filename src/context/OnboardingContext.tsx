"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface OnboardingData {
  businessName: string;
  slogan: string;
  industry: string;
  targetAudience: string;
  designStyle: string;
  colorPalette: string;
  rawDescription: string;
  brandkit?: {
    primaryColor: string;
    secondaryColor: string;
    typographyScheme: string;
    logoConceptShape: string;
    logoBase64?: string;
  };
}

interface OnboardingContextType {
  currentStep: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  data: OnboardingData;
  updateData: (fields: Partial<OnboardingData>) => void;
}

const defaultData: OnboardingData = {
  businessName: "",
  slogan: "",
  industry: "",
  targetAudience: "",
  designStyle: "",
  colorPalette: "",
  rawDescription: "",
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(defaultData);

  const setStep = useCallback((step: number) => setCurrentStep(step), []);
  const nextStep = useCallback(() => setCurrentStep((prev) => Math.min(prev + 1, 5)), []);
  const prevStep = useCallback(() => setCurrentStep((prev) => Math.max(prev - 1, 1)), []);

  const updateData = useCallback((fields: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  }, []);

  return (
    <OnboardingContext.Provider value={{ currentStep, setStep, nextStep, prevStep, data, updateData }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
