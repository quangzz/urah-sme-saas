"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWebsiteContent } from "@/context/WebsiteContentContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Sparkles, Save, Globe, Code2, Eye, ChevronDown, ChevronUp } from "lucide-react";

// Loại trang web hỗ trợ
const PAGE_TYPES = [
  { value: "Landing Page", label: "Landing Page", desc: "Trang chủ / Trang đích chuyển đổi" },
  { value: "About Us", label: "About Us", desc: "Giới thiệu công ty / đội ngũ" },
  { value: "Product", label: "Product / Service", desc: "Trang sản phẩm / dịch vụ" },
  { value: "Contact", label: "Contact", desc: "Trang liên hệ / đặt lịch" },
];

export default function NewWebsiteContentPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const { user } = useAuth();

  const { addWebsiteContent } = useWebsiteContent();

  // Form state
  const [pageType, setPageType] = useState("Landing Page");
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [requirements, setRequirements] = useState("");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [showSchema, setShowSchema] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;

    setGenerating(true);
    setGeneratedResult(null);

    try {
      const token = (user && typeof user.getIdToken === "function")
        ? await user.getIdToken()
        : "demo-token";

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const res = await fetch(`${apiUrl}/api/v2/generate-website`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          projectId,
          topic,
          targetAudience,
          requirements,
          pageType,
        }),
      });

      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      setGeneratedResult(data.data);
    } catch (e) {
      console.error("[DEBUG][WebsiteNew] Generate error:", e);
      // Fallback demo
      setTimeout(() => {
        setGeneratedResult({
          heroSection: {
            headline: `${topic} — Giải pháp hàng đầu cho doanh nghiệp`,
            subheadline: "Nâng tầm trải nghiệm khách hàng với giải pháp toàn diện",
            cta: "Khám phá ngay",
          },
          features: [
            { title: "Hiệu suất vượt trội", description: "Tối ưu hoá quy trình vận hành giúp tiết kiệm 40% chi phí." },
            { title: "Bảo mật tuyệt đối", description: "Hệ thống mã hóa chuẩn quân sự, tuân thủ GDPR và ISO 27001." },
            { title: "Hỗ trợ 24/7", description: "Đội ngũ chuyên gia hỗ trợ xuyên suốt, cam kết phản hồi dưới 30 phút." },
          ],
          socialProof: "\"Đây là công cụ thay đổi cuộc chơi cho doanh nghiệp chúng tôi. Doanh thu tăng 60% trong 3 tháng.\" — CEO TechViet Corp",
          metaTitle: `${topic} | Giải pháp SME #1 Việt Nam`,
          metaDescription: `Tìm hiểu về ${topic}. Giải pháp toàn diện dành cho SME với công nghệ AI tiên tiến.`,
          jsonLdSchema: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: topic,
            description: `Trang chính thức giới thiệu ${topic}`,
          }, null, 2),
        });
      }, 1500);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedResult) return;

    // Tạo contentBody từ heroSection + features
    const contentParts = [
      `# ${generatedResult.heroSection?.headline || ""}`,
      `\n${generatedResult.heroSection?.subheadline || ""}`,
      `\n**CTA:** ${generatedResult.heroSection?.cta || ""}`,
      "\n\n---\n",
    ];

    if (generatedResult.features) {
      generatedResult.features.forEach((f: any, i: number) => {
        contentParts.push(`\n## ${i + 1}. ${f.title}`);
        contentParts.push(`\n${f.description}`);
      });
    }

    if (generatedResult.socialProof) {
      contentParts.push(`\n\n---\n\n> ${generatedResult.socialProof}`);
    }

    await addWebsiteContent({
      contentBody: contentParts.join(""),
      metaData: {
        title: generatedResult.metaTitle || topic,
        description: generatedResult.metaDescription || "",
      },
      structuredSchema: typeof generatedResult.jsonLdSchema === "string"
        ? generatedResult.jsonLdSchema
        : JSON.stringify(generatedResult.jsonLdSchema, null, 2),
      extractedAssets: [],
      status: "draft",
    });

    router.push(`/workspace/${workspaceId}/project/${projectId}/website`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <button onClick={() => router.back()} className="flex items-center hover:text-foreground transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Quay lại
        </button>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-8 flex items-center gap-3">
        <Globe className="text-blue-500" size={28} />
        AI Website Content Generator
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Settings Panel */}
        <div className="space-y-6 bg-card p-6 rounded-2xl border shadow-sm h-fit">
          {/* Loại trang */}
          <div>
            <label className="text-sm font-medium mb-2 block">Loại trang web</label>
            <div className="grid grid-cols-2 gap-2">
              {PAGE_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  onClick={() => setPageType(pt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    pageType === pt.value
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "hover:bg-accent hover:border-border"
                  }`}
                >
                  <div className="text-sm font-medium">{pt.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{pt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chủ đề / Keyword */}
          <div>
            <label className="text-sm font-medium mb-2 block">Chủ đề / Keywords chính</label>
            <textarea
              className="w-full h-24 p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
              placeholder="VD: Giải pháp phần mềm quản lý doanh nghiệp, CRM, ERP..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {/* Đối tượng mục tiêu */}
          <div>
            <label className="text-sm font-medium mb-2 block">Đối tượng mục tiêu (tuỳ chọn)</label>
            <input
              type="text"
              className="w-full p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="VD: Doanh nghiệp vừa và nhỏ, startup công nghệ..."
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          {/* Yêu cầu riêng */}
          <div>
            <label className="text-sm font-medium mb-2 block">Yêu cầu Website (tuỳ chọn)</label>
            <textarea
              className="w-full h-20 p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
              placeholder="VD: Cần nhấn mạnh vào tính năng A, phong cách chuyên nghiệp, độ dài linh hoạt..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </div>

          {/* Generate Button */}
          <Button
            className="w-full py-6 text-lg rounded-xl shadow-lg group"
            onClick={handleGenerate}
            disabled={!topic || generating}
          >
            {generating ? (
              <span className="flex items-center animate-pulse">
                <Sparkles className="mr-2 h-5 w-5" /> Đang sinh nội dung...
              </span>
            ) : (
              <span className="flex items-center">
                <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" /> Tạo nội dung Website
              </span>
            )}
          </Button>
        </div>

        {/* RIGHT: Preview Panel */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border shadow-sm min-h-[500px] flex flex-col overflow-hidden">
            {/* Preview Header */}
            <div className="px-6 py-4 border-b bg-muted/30">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Eye size={14} /> Preview
              </h3>
            </div>

            {generatedResult ? (
              <div className="p-6 flex-1 flex flex-col animate-in slide-in-from-right-4 duration-500 overflow-y-auto">
                {/* Hero Section Preview */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white rounded-xl p-6 mb-6">
                  <h2 className="text-xl font-bold mb-2">{generatedResult.heroSection?.headline}</h2>
                  <p className="text-blue-100 text-sm mb-4">{generatedResult.heroSection?.subheadline}</p>
                  <div className="inline-block px-4 py-2 bg-white text-blue-700 font-semibold rounded-lg text-sm">
                    {generatedResult.heroSection?.cta}
                  </div>
                </div>

                {/* Features */}
                {generatedResult.features && (
                  <div className="grid grid-cols-1 gap-3 mb-6">
                    {generatedResult.features.map((f: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                        <h4 className="font-semibold text-sm mb-1">{f.title}</h4>
                        <p className="text-xs text-muted-foreground">{f.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Social Proof */}
                {generatedResult.socialProof && (
                  <blockquote className="border-l-4 border-primary pl-4 italic text-sm text-muted-foreground mb-6">
                    {generatedResult.socialProof}
                  </blockquote>
                )}

                {/* SEO Meta Preview */}
                <div className="bg-muted/30 rounded-xl p-4 mb-4 border">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">SEO Preview (Google)</h5>
                  <div className="text-blue-600 dark:text-blue-400 font-medium text-sm hover:underline cursor-pointer">
                    {generatedResult.metaTitle}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-500 mt-0.5">
                    example.com › {pageType.toLowerCase().replace(/\s/g, "-")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {generatedResult.metaDescription}
                  </div>
                </div>

                {/* JSON-LD Schema collapsible */}
                {generatedResult.jsonLdSchema && (
                  <div className="border rounded-xl overflow-hidden mb-6">
                    <button
                      onClick={() => setShowSchema(!showSchema)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Code2 size={14} className="text-emerald-500" /> JSON-LD Schema
                      </span>
                      {showSchema ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {showSchema && (
                      <pre className="p-4 text-xs font-mono bg-zinc-950 text-green-400 overflow-x-auto max-h-60">
                        {typeof generatedResult.jsonLdSchema === "string"
                          ? generatedResult.jsonLdSchema
                          : JSON.stringify(generatedResult.jsonLdSchema, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {/* Save Button */}
                <Button className="w-full py-6 rounded-xl mt-auto" onClick={handleSave}>
                  <Save className="mr-2 h-5 w-5" /> Lưu bản nháp
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col text-muted-foreground p-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                  <Globe size={24} className="text-blue-500 opacity-60" />
                </div>
                <p className="text-center">Chọn loại trang, nhập chủ đề và nhấn Generate.<br />Nội dung website chuẩn SEO sẽ hiển thị ở đây.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
