"use client";

import { useOnboarding } from "@/context/OnboardingContext";
import { Button } from "@/components/ui/Button";

const palettes = [
  { name: "Ocean", colors: ["#0ea5e9", "#2563eb", "#1e3a8a"] },
  { name: "Sunset", colors: ["#fb923c", "#ef4444", "#7f1d1d"] },
  { name: "Forest", colors: ["#4ade80", "#16a34a", "#14532d"] },
  { name: "Monochrome", colors: ["#9ca3af", "#4b5563", "#111827"] },
  { name: "Luxury", colors: ["#fde047", "#eab308", "#854d0e"] },
  { name: "Playful", colors: ["#f472b6", "#a855f7", "#3b82f6"] }
];

export function Step3Style() {
  const { data, updateData, nextStep } = useOnboarding();

  const handleSelect = (name: string) => {
    updateData({ colorPalette: name });
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full">
      <h2 className="text-3xl font-bold mb-3 text-center tracking-tight">Pick a color palette</h2>
      <p className="text-muted-foreground text-center mb-10">Colors convey the personality of your brand.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
        {palettes.map((palette) => {
          const isSelected = data.colorPalette === palette.name;
          return (
            <div 
              key={palette.name}
              onClick={() => handleSelect(palette.name)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'bg-card border-border hover:border-primary/50'}`}
            >
              <div className="flex rounded-lg overflow-hidden h-24 w-full mb-3 shadow-inner">
                {palette.colors.map(c => (
                  <div key={c} style={{ backgroundColor: c }} className="flex-1 h-full" />
                ))}
              </div>
              <h4 className="font-medium text-center">{palette.name}</h4>
            </div>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto w-full mb-12">
        <label className="block text-sm font-medium mb-2">Mô tả thô (Raw Content) - Tùy chọn</label>
        <textarea 
          className="w-full p-4 rounded-xl border bg-card text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow"
          rows={3}
          placeholder="E.g., Tôi muốn một logo hình tam giác mạnh mẽ màu xanh, kết hợp phong cách cyberpunk..."
          value={data.rawDescription || ""}
          onChange={(e) => updateData({ rawDescription: e.target.value })}
        />
        <p className="text-xs text-muted-foreground mt-2">Dùng để mô tả rõ định hướng logo cho AI.</p>
      </div>

      <div className="flex justify-center">
        <Button 
          size="lg" 
          className="px-12 rounded-full text-lg shadow-lg"
          disabled={!data.colorPalette}
          onClick={nextStep}
        >
          Generate Brand Concept
        </Button>
      </div>
    </div>
  );
}
