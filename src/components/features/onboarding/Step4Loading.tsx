"use client";

import { useEffect, useState, useRef } from "react";
import { useOnboarding } from "@/context/OnboardingContext";
import { Sparkles, Palette, Layers, Wand2 } from "lucide-react";

const texts = [
  "Analyzing your industry...",
  "Matching colors and typography...",
  "Applying design patterns...",
  "Adding a touch of magic...",
  "Finalizing your brandkit..."
];

const Icons = [Layers, Palette, Sparkles, Wand2];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function Step4Loading() {
  const { nextStep, data, updateData } = useOnboarding();
  const [loadingText, setLoadingText] = useState("Analyzing your industry...");
  const [iconKey, setIconKey] = useState(0);

  // Refs to prevent re-triggering on data/state changes (avoids infinite loop)
  const hasStarted = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    // Guard: ensure this effect body runs exactly once
    if (hasStarted.current) return;
    hasStarted.current = true;

    let index = 0;
    const interval = setInterval(() => {
      index++;
      if (index < texts.length) {
        setLoadingText(texts[index]);
        setIconKey(index % Icons.length);
      }
    }, 1000);

    const generateAI = async () => {
      try {
        const currentData = dataRef.current;
        const payload = {
          businessName: currentData.businessName,
          industry: currentData.industry,
          colorStyle: currentData.colorPalette,
          slogan: currentData.slogan,
          rawDescription: currentData.rawDescription
        };
        
        // 1. Generate Brandkit String data
        const res = await fetch(`${API_URL}/api/generate-brandkit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
           const jsonResponse = await res.json();
           const cleanedStr = jsonResponse.data.replace(/```json/g, '').replace(/```/g, '').trim();
           const brandkitObj = JSON.parse(cleanedStr);
           // Removed Logo generation. We only save the brandkit text. Logo generation will be triggered in Step 5.
           updateData({ brandkit: brandkitObj });
        }
      } catch (e) {
        console.error("Lỗi gọi AI sinh Brandkit/Logo:", e);
      } finally {
        nextStep();
      }
    };

    // Đợi tối thiểu 2 giây để thấy animation, sau đó gọi AI
    const timeout = setTimeout(() => {
       generateAI();
    }, 2000);

    return () => {
      // IMPORTANT: Reset ref so React StrictMode's intentional double-mount
      // works correctly in development. Without this, cleanup cancels the
      // timeout but leaves hasStarted=true, blocking the second (real) mount.
      hasStarted.current = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const IconComponent = Icons[iconKey];

  return (
    <div className="flex flex-col items-center justify-center animate-in fade-in duration-700 min-h-[40vh] w-full">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse"></div>
        <div className="relative w-24 h-24 bg-card border rounded-full flex items-center justify-center shadow-xl z-10 animate-bounce">
          <IconComponent size={40} className="text-primary animate-pulse" />
        </div>
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-center animate-pulse">{loadingText}</h2>
    </div>
  );
}
