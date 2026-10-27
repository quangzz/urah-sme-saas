"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Copy, UploadCloud, Type, Star } from "lucide-react";
import { useBrandkits } from "@/context/BrandkitContext";

export default function BrandkitPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  
  const { brandkits, loading, updateBrandkit, addBrandkit, setPrimaryBrandkit } = useBrandkits();
  const [activeBrandkitId, setActiveBrandkitId] = useState<string | null>(null);

  // Form states tracking active brandkit
  const [typography, setTypography] = useState({ heading: "Inter", body: "Roboto" });
  const [colors, setColors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBrandkitId) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      await updateBrandkit(activeBrandkitId, { logoBase64: base64String });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  useEffect(() => {
    if (!loading && brandkits.length > 0) {
      if (!activeBrandkitId) {
        const primary = brandkits.find(b => b.isPrimary) || brandkits[0];
        setActiveBrandkitId(primary.id);
        setTypography({ 
          heading: primary.typography?.heading || "Inter", 
          body: primary.typography?.body || "Roboto" 
        });
        setColors(primary.colorPalette || []);
      } else {
        const current = brandkits.find(b => b.id === activeBrandkitId);
        if (current) {
          setTypography({ 
            heading: current.typography?.heading || "Inter", 
            body: current.typography?.body || "Roboto" 
          });
          setColors(current.colorPalette || []);
        }
      }
    }
  }, [loading, brandkits, activeBrandkitId]);

  const handleSave = async () => {
    if (!activeBrandkitId) return;
    await updateBrandkit(activeBrandkitId, {
      typography,
      colorPalette: colors,
    });
    alert("Saved Successfully!");
  };

  const currentBrandkit = brandkits.find(b => b.id === activeBrandkitId);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Brandkits...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
        <span>Workspace</span><span>/</span>
        <span className="font-mono">{workspaceId}</span><span>/</span>
        <span className="cursor-pointer hover:text-foreground hover:underline" onClick={() => router.push(`/workspace/${workspaceId}/project/${projectId}`)}>Project</span><span>/</span>
        <span className="text-foreground font-medium">Brandkit</span>
      </div>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Brandkit Configuration</h1>
          <p className="text-muted-foreground">Define colors, typography, and assets for your project.</p>
        </div>
        <div className="flex gap-3">
          {currentBrandkit && !currentBrandkit.isPrimary && (
            <Button variant="outline" onClick={() => setPrimaryBrandkit(currentBrandkit.id)}>Set as Primary</Button>
          )}
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>

      {brandkits.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-4 border-b">
          {brandkits.map(bk => (
            <div 
              key={bk.id}
              onClick={() => setActiveBrandkitId(bk.id)}
              className={`px-4 py-2 rounded-lg border cursor-pointer flex items-center gap-2 transition-colors ${activeBrandkitId === bk.id ? 'bg-primary/10 border-primary text-primary font-medium' : 'bg-card text-muted-foreground hover:bg-accent'}`}
            >
              {bk.isPrimary && <Star size={14} className="fill-current" />}
              Version / {bk.id.slice(0,5)}
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => addBrandkit({ colorPalette: [], typography: { heading: 'Inter', body: 'Roboto' }, brandVoice: '', visualContext: '' })}>
            + New Version
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <div className="p-6 border rounded-xl bg-card space-y-4">
           <h3 className="font-semibold flex items-center border-b pb-2"><Type className="mr-2 h-4 w-4"/> Typography</h3>
           <div>
             <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Primary Font</label>
             <input type="text" className="w-full h-10 px-3 bg-input rounded-md border text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
              value={typography.heading} onChange={(e) => setTypography(prev => ({...prev, heading: e.target.value}))} />
           </div>
           <div>
             <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Secondary Font</label>
             <input type="text" className="w-full h-10 px-3 bg-input rounded-md border text-sm focus:ring-2 focus:ring-primary focus:outline-none" 
              value={typography.body} onChange={(e) => setTypography(prev => ({...prev, body: e.target.value}))} />
           </div>
        </div>

        <div className="p-6 border rounded-xl bg-card space-y-4 lg:col-span-2">
           <h3 className="font-semibold flex items-center border-b pb-2"><Copy className="mr-2 h-4 w-4"/> Brand Colors</h3>
            <div className="flex flex-wrap gap-4">
              {colors.map((color, i) => (
                <div key={i} className="p-2 border rounded-lg flex flex-col items-center hover:scale-105 transition-transform cursor-pointer relative group">
                  <div className="relative mb-2">
                    <div className="w-12 h-12 rounded-md shadow-inner overflow-hidden border" style={{ backgroundColor: color }}></div>
                    <input 
                      type="color" 
                      value={color.startsWith('#') && color.length === 7 ? color : '#000000'}
                      onChange={(e) => {
                        const newColors = [...colors];
                        newColors[i] = e.target.value.toUpperCase();
                        setColors(newColors);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <input 
                    type="text"
                    value={color}
                    onChange={(e) => {
                      const newColors = [...colors];
                      newColors[i] = e.target.value;
                      setColors(newColors);
                    }}
                    className="text-xs font-mono text-center w-16 bg-transparent border-b border-transparent hover:border-input focus:border-primary focus:outline-none transition-colors"
                  />
                  <div 
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex flex-col items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); setColors(prev => prev.filter((_, idx) => idx !== i)); }}
                  >
                    ×
                  </div>
                </div>
              ))}
              <div 
                className="p-2 border border-dashed rounded-lg flex flex-col items-center justify-center w-[5.5rem] h-[5.5rem] hover:bg-accent transition-colors cursor-pointer text-muted-foreground"
                onClick={() => setColors(prev => [...prev, '#000000'])}
              >
                 <Copy size={20} />
                 <span className="text-xs mt-1">Add</span>
              </div>
           </div>
        </div>

        <div className="p-6 border rounded-xl bg-card space-y-4 lg:col-span-3">
           <h3 className="font-semibold flex items-center border-b pb-2"><UploadCloud className="mr-2 h-4 w-4"/> Assets</h3>
           
           {currentBrandkit?.logoBase64 || currentBrandkit?.logoAssets?.png ? (
             <div className="flex items-center gap-6">
                <img src={currentBrandkit.logoBase64 || currentBrandkit.logoAssets.png} alt="Brand Logo" className="w-32 h-32 object-contain bg-accent/30 rounded-xl border p-2" />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud className="mr-2 h-4 w-4" /> Replace Logo
                </Button>
             </div>
           ) : (
             <div 
               className="w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:bg-accent/50 hover:border-primary transition-colors cursor-pointer"
               onClick={() => fileInputRef.current?.click()}
             >
                <UploadCloud size={32} className="mb-2" />
                <p className="text-sm font-medium">Click or drag and drop to upload logo/images</p>
                <p className="text-xs mt-1">SVG, PNG, JPG (max 5MB)</p>
             </div>
           )}
           <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/svg+xml,image/png,image/jpeg" 
              onChange={handleFileUpload} 
           />
        </div>
      </div>
    </div>
  );
}
