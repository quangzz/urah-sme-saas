"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocialContent } from "@/context/SocialContentContext";
import { useBrandkits } from "@/context/BrandkitContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Sparkles, Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export default function NewSocialPostPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  
  const { addPost } = useSocialContent();
  const { brandkits } = useBrandkits();
  
  const [platform, setPlatform] = useState("facebook");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [requirements, setRequirements] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);

  const primaryBrandkit = brandkits.find(b => b.isPrimary) || brandkits[0];

  const { user } = useAuth();

  const handleGenerate = async () => {
    if (!topic) {
      console.log("Missing topic", { topic });
      return;
    }
    
    setGenerating(true);
    setGeneratedResult(null);
    try {
      // Setup payload
      const payload = {
        workspaceId,
        projectId,
        platform,
        topic,
        tone,
        requirements,
        brand_context: JSON.stringify({
          brand_name: "My Brand", 
          colorPalette: primaryBrandkit?.colorPalette || ["#ffffff", "#000000"],
          typography: primaryBrandkit?.typography || { heading: "Inter", body: "Roboto" }
        })
      };

      const token = (user && typeof user.getIdToken === 'function') 
          ? await user.getIdToken() 
          : "demo-token";

      // Bỏ qua Node Gateway để nối thẳng với FastAPI Backend trong lúc Dev
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const res = await fetch(`${apiUrl}/api/v2/generate-social`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error(`API call failed with status: ${res.status}`);
      const data = await res.json();
      setGeneratedResult(data.data);
      setGenerating(false);

    } catch (e) {
      console.error(e);
      // Fallback Demo Response for robust testing
      setTimeout(() => {
        setGeneratedResult({
           caption: `🚀 Exciting news! We are thrilled to share our latest update on ${topic}.\n\nStay tuned for more! #growth #success`,
           hashtags: ["#" + topic.replace(/\s+/g, ''), "#marketing"],
           imagePrompt: `A vibrant abstract composition supporting the topic: ${topic}`
        });
        setGenerating(false);
      }, 1500);
    }
  };

  const handleSave = async () => {
    if (!generatedResult) return;
    
    await addPost({
      platform: platform as any,
      caption: generatedResult.caption,
      hashtags: generatedResult.hashtags || [],
      aiPromptHistory: JSON.stringify({ topic, tone }),
      status: "draft",
      // imageBase64 could be passed if we generated image, omitted for now
    });
    
    router.push(`/workspace/${workspaceId}/project/${projectId}/social`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <button onClick={() => router.back()} className="flex items-center hover:text-foreground">
          <ArrowLeft size={16} className="mr-1" /> Back to Social Board
        </button>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-8">AI Post Generator</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT COMPANION: SETTINGS */}
        <div className="space-y-6 bg-card p-6 rounded-2xl border shadow-sm h-fit">
          <div>
            <label className="text-sm font-medium mb-2 block">Platform</label>
            <div className="flex flex-wrap gap-2">
              {['facebook', 'instagram', 'linkedin', 'tiktok', 'twitter'].map(plat => (
                <button 
                  key={plat}
                  onClick={() => setPlatform(plat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize border transition-all ${platform === plat ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent'}`}
                >
                  {plat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Topic & Details</label>
            <textarea 
              className="w-full h-32 p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="E.g., Launching our new summer collection next week..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Yêu cầu riêng</label>
            <textarea 
              className="w-full h-24 p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="VD: Không dùng đại từ nhân xưng 'tôi', tập trung vào lợi ích giá cả..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Tone of Voice</label>
            <select 
              className="w-full p-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="professional">Professional & Authoritative</option>
              <option value="casual">Casual & Friendly</option>
              <option value="enthusiastic">Enthusiastic & Exciting</option>
              <option value="humorous">Humorous & Witty</option>
            </select>
          </div>

          <Button 
            className="w-full py-6 text-lg rounded-xl shadow-lg group" 
            onClick={handleGenerate}
            disabled={!topic || generating}
          >
            {generating ? (
               <span className="flex items-center animate-pulse"><Sparkles className="mr-2 h-5 w-5" /> Generating Magic...</span>
            ) : (
               <span className="flex items-center"><Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" /> Generate Content</span>
            )}
          </Button>
        </div>

        {/* RIGHT COMPANION: PREVIEW */}
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-2xl border shadow-sm min-h-[400px] flex flex-col">
             <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider border-b pb-3 mb-4">Preview</h3>
             
             {generatedResult ? (
               <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-500">
                  <div className="mb-4 aspect-video bg-muted rounded-xl flex items-center justify-center text-muted-foreground relative overflow-hidden flex-shrink-0 border-2 border-dashed border-border/50">
                    <p className="text-xs absolute bottom-2 right-2 bg-background/50 px-2 py-1 rounded">Visual Concept</p>
                    <span className="max-w-[80%] text-center px-4 italic text-sm">{generatedResult.imagePrompt || "No image requested"}</span>
                  </div>
                  
                  <div className="flex-1 whitespace-pre-wrap text-sm leading-relaxed mb-4">
                    {generatedResult.caption}
                  </div>
                  
                  {generatedResult.hashtags && (
                    <div className="text-primary text-sm font-medium mb-6">
                      {Array.isArray(generatedResult.hashtags) ? generatedResult.hashtags.join(" ") : generatedResult.hashtags}
                    </div>
                  )}
                  
                  <Button className="w-full py-6 rounded-xl mt-auto" onClick={handleSave}>
                     <Send className="mr-2 h-5 w-5" /> Save to Drafts
                  </Button>
               </div>
             ) : (
               <div className="flex-1 flex items-center justify-center flex-col text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
                     <Sparkles size={24} className="opacity-50" />
                  </div>
                  <p>Your AI-generated post will appear here</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
