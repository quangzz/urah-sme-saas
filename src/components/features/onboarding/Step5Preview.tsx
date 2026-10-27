"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/context/OnboardingContext";
import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/context/ProjectContext";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { AuthForm } from "@/components/features/auth/AuthForm";

export function Step5Preview() {
  const { data, updateData } = useOnboarding();
  const { user } = useAuth();
  const { addProject } = useProjects();
  const router = useRouter();
  const [showSignupWall, setShowSignupWall] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);

  const handleGenerateLogo = async () => {
    setIsGeneratingLogo(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const logoPayload = {
         businessName: data.businessName || "Urah",
         primaryColor: data.brandkit?.primaryColor || "#000000",
         secondaryColor: data.brandkit?.secondaryColor || "#FFFFFF",
         shape: data.brandkit?.logoConceptShape || "geometric shape"
      };
      
      const logoRes = await fetch(`${API_URL}/api/generate-logo`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(logoPayload)
      });
      
      if (logoRes.ok) {
         const logoJsonResponse = await logoRes.json();
         if (logoJsonResponse.success && logoJsonResponse.logo_base64) {
             updateData({ 
                 brandkit: { 
                    ...data.brandkit!, 
                    logoBase64: logoJsonResponse.logo_base64 
                 } 
             });
         } else {
             alert(logoJsonResponse.detail || "Failed to generate logo.");
         }
      } else {
         alert("Failed to connect to logo service.");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating logo.");
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  useEffect(() => {
    // If they reach this step and are NOT logged in, show the wall after a slight delay
    if (!user) {
      const t = setTimeout(() => {
        setShowSignupWall(true);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [user]);

  useEffect(() => {
    // If they successfully login within the modal, close modal
    if (user && showSignupWall) {
      setShowSignupWall(false);
    }
  }, [user, showSignupWall]);

  const handleFinish = async () => {
    if (!user) {
      setShowSignupWall(true);
      return;
    }

    setIsSaving(true);
    try {
      // Strip logoBase64 to avoid exceeding Firestore's 1MB document limit.
      // The logo is already displayed in the preview; for persistence,
      // it should be uploaded to Firebase Storage separately.
      const { brandkit, ...restData } = data;
      const safeBrandkit = brandkit ? { ...brandkit } : undefined;
      if (safeBrandkit?.logoBase64) {
        delete safeBrandkit.logoBase64;
      }

      // Use ProjectContext.addProject — handles both Firestore (real) and
      // localStorage (demo mode) transparently.
      const projectId = await addProject({
        ...restData,
        brandName: data.businessName || "Untitled Project",
        brandkit: safeBrandkit,
        workspaceId: user.uid,
      });

      router.push(`/workspace/${user.uid}/project/${projectId}`);
    } catch (error) {
      console.error("Error creating project:", error);
      router.push(`/workspace/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-700 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Custom Designs</h2>
          <p className="text-muted-foreground mt-1">Select a brandkit to customize further.</p>
        </div>
        <button
          onClick={handleFinish}
          disabled={isSaving}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : user ? "Go to Dashboard" : "Save & Continue"}
        </button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-[1500ms] ${!user ? 'blur-md opacity-60 select-none pointer-events-none' : ''}`}>
        {data.brandkit ? (
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="h-48 flex items-center justify-center p-6 relative" style={{ backgroundColor: data.brandkit.primaryColor }}>
               {/* Real Logo Design */}
               <div className="flex flex-col items-center">
                 {data.brandkit.logoBase64 ? (
                    <img src={data.brandkit.logoBase64} alt="Generated Logo" className="w-24 h-24 mb-4 object-contain drop-shadow-md rounded-xl bg-white/20 p-2" />
                 ) : (
                    <div className="flex flex-col items-center justify-center p-4 bg-background/80 rounded-xl mb-4 backdrop-blur-md shadow-lg border border-border/50">
                       {isGeneratingLogo ? (
                          <div className="flex flex-col items-center gap-2 text-foreground">
                             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                             <span className="text-xs font-medium">Generating...</span>
                          </div>
                       ) : (
                          <>
                            <span className="font-bold text-2xl mb-3" style={{ color: data.brandkit.primaryColor }}>{data.businessName.charAt(0) || "U"}</span>
                            <button onClick={handleGenerateLogo} className="bg-primary text-primary-foreground px-4 py-2 text-xs rounded-full font-medium shadow hover:shadow-md transition-all hover:-translate-y-0.5">
                               Tạo Ảnh Logo Này
                            </button>
                          </>
                       )}
                    </div>
                 )}
                 <h3 className="font-bold text-xl tracking-tight" style={{ color: data.brandkit.secondaryColor || '#fff' }}>{data.businessName || "Your Company"}</h3>
                 {data.slogan && <p className="text-xs mt-1 tracking-widest uppercase opacity-80" style={{ color: data.brandkit.secondaryColor || '#ccc' }}>{data.slogan}</p>}
               </div>
            </div>
            <div className="p-4 border-b text-sm bg-card">
               <p className="font-semibold text-foreground mb-1 text-xs uppercase tracking-wider">Concept Text (Mô tả):</p>
               <p className="text-muted-foreground italic">&quot;{data.brandkit.logoConceptShape}&quot;</p>
            </div>
            <div className="p-4 flex gap-2 bg-muted/20">
               <div className="flex-1 h-3 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: data.brandkit.primaryColor }}></div>
               <div className="flex-1 h-3 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: data.brandkit.secondaryColor }}></div>
            </div>
          </div>
        ) : (
          <div className="text-center w-full col-span-full py-12">
            <p className="text-muted-foreground animate-pulse text-lg">Loading your custom designs...</p>
          </div>
        )}
      </div>

      {/* Signup Wall */}
      <Modal isOpen={showSignupWall} dismissible={false}>
         <AuthForm title="Save Your Designs" subtitle="Create an account to view and customize your AI generated brandkits." />
      </Modal>
    </div>
  );
}
