"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePRContent } from "@/context/PRContentContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Sparkles, Save, Newspaper, BookOpen, Link as LinkIcon, Hash } from "lucide-react";

export default function NewPRArticlePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const { user } = useAuth();

  const { addPRArticle } = usePRContent();

  // Form state
  const [topic, setTopic] = useState("");
  const [focusKeywords, setFocusKeywords] = useState("");
  const [requirements, setRequirements] = useState("");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);

  // Đếm số từ trong articleBody
  const wordCount = useMemo(() => {
    if (!generatedResult?.articleBody) return 0;
    return generatedResult.articleBody.split(/\s+/).filter(Boolean).length;
  }, [generatedResult]);

  const handleGenerate = async () => {
    if (!topic || !focusKeywords) return;

    setGenerating(true);
    setGeneratedResult(null);

    try {
      const token = (user && typeof user.getIdToken === "function")
        ? await user.getIdToken()
        : "demo-token";

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const res = await fetch(`${apiUrl}/api/v2/generate-pr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          projectId,
          topic,
          focusKeywords,
          requirements,
        }),
      });

      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      setGeneratedResult(data.data);
    } catch (e) {
      console.error("[DEBUG][PRNew] Generate error:", e);
      // Fallback demo
      setTimeout(() => {
        setGeneratedResult({
          title: `${topic}: Chiến lược toàn diện cho doanh nghiệp SME năm 2026`,
          metaTitle: `${topic} — Hướng dẫn chi tiết | URAH SME`,
          metaDescription: `Khám phá ${topic} với bài phân tích chuyên sâu. Từ chiến lược đến thực thi, đây là tất cả những gì bạn cần biết.`,
          focusKeyword: focusKeywords,
          suggestedOutboundLinks: ["Harvard Business Review", "Forbes Vietnam", "Statista"],
          articleBody: `## Mở đầu: Tại sao ${topic} là ưu tiên hàng đầu?\n\nTrong bối cảnh kinh doanh ngày càng cạnh tranh, **${topic}** đã trở thành yếu tố then chốt quyết định sự tồn vong của mọi doanh nghiệp. Theo nghiên cứu từ McKinsey & Company, hơn 78% doanh nghiệp SME tại Đông Nam Á cho rằng đây là thách thức lớn nhất trong giai đoạn 2025-2030.\n\n> "Doanh nghiệp nào nắm bắt được ${focusKeywords} sẽ dẫn đầu thị trường trong thập kỷ tới." — Chuyên gia phân tích, Deloitte Consulting\n\n### Bối cảnh thị trường hiện tại\n\nThị trường Việt Nam đang chứng kiến sự chuyển đổi mạnh mẽ:\n\n- **Tăng trưởng GDP** dự kiến đạt 6.5% năm 2026\n- **Chi tiêu cho công nghệ** tăng 35% so với năm trước\n- **Số lượng startup** vượt mốc 10,000 đơn vị\n\n## Phân tích chuyên sâu: 5 trụ cột then chốt\n\n### 1. Chiến lược & Tầm nhìn\n\nMột chiến lược ${focusKeywords} hiệu quả bắt đầu từ việc xác định rõ mục tiêu dài hạn...\n\n### 2. Công nghệ & Hạ tầng\n\nĐầu tư vào hạ tầng công nghệ là nền tảng không thể thiếu...\n\n### 3. Nhân lực & Đào tạo\n\nCon người luôn là yếu tố quyết định sự thành bại...\n\n### 4. Đo lường & Tối ưu\n\nKhông thể cải thiện những gì không đo lường được...\n\n### 5. Mở rộng & Bền vững\n\nTăng trưởng bền vững là đích đến cuối cùng...\n\n## Kết luận\n\nVới sự hỗ trợ của các giải pháp AI tiên tiến từ URAH, doanh nghiệp SME hoàn toàn có thể chinh phục ${topic} một cách hiệu quả và bền vững.`,
        });
      }, 2000);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedResult) return;

    await addPRArticle({
      headline: generatedResult.title || topic,
      pressReleaseBody: generatedResult.articleBody || "",
      authorInfo: {
        name: "AI Content Writer",
        title: "Senior Content Strategist",
        bio: "Chuyên gia viết bài PR/SEO sử dụng AI chuẩn E-E-A-T",
      },
      mediaContacts: [],
      prSchema: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: generatedResult.title,
        description: generatedResult.metaDescription,
        keywords: generatedResult.focusKeyword,
      }),
      status: "draft",
    });

    router.push(`/workspace/${workspaceId}/project/${projectId}/pr`);
  };

  // Render markdown đơn giản (h2, h3, bold, blockquote, list)
  const renderMarkdown = (md: string) => {
    if (!md) return null;

    const lines = md.split("\n");
    const elements: React.ReactElement[] = [];

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) {
        elements.push(<div key={i} className="h-3" />);
      } else if (trimmed.startsWith("## ")) {
        elements.push(
          <h2 key={i} className="text-lg font-bold mt-6 mb-2 text-foreground">
            {trimmed.replace("## ", "")}
          </h2>
        );
      } else if (trimmed.startsWith("### ")) {
        elements.push(
          <h3 key={i} className="text-base font-semibold mt-4 mb-1.5 text-foreground">
            {trimmed.replace("### ", "")}
          </h3>
        );
      } else if (trimmed.startsWith("> ")) {
        elements.push(
          <blockquote key={i} className="border-l-4 border-primary pl-4 italic text-sm text-muted-foreground my-3 py-1">
            {trimmed.replace("> ", "")}
          </blockquote>
        );
      } else if (trimmed.startsWith("- ")) {
        elements.push(
          <li key={i} className="text-sm leading-relaxed ml-4 list-disc text-muted-foreground">
            <span dangerouslySetInnerHTML={{ __html: trimmed.replace("- ", "").replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground'>$1</strong>") }} />
          </li>
        );
      } else {
        elements.push(
          <p key={i} className="text-sm leading-relaxed text-muted-foreground">
            <span dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground'>$1</strong>") }} />
          </p>
        );
      }
    });

    return <div className="space-y-0">{elements}</div>;
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
        <Newspaper className="text-orange-500" size={28} />
        AI PR Article Generator
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* LEFT: Settings Panel (2/5 width) */}
        <div className="lg:col-span-2 space-y-6 bg-card p-6 rounded-2xl border shadow-sm h-fit">
          {/* Chủ đề bài viết */}
          <div>
            <label className="text-sm font-medium mb-2 block">Chủ đề bài viết</label>
            <textarea
              className="w-full h-28 p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
              placeholder="VD: Chuyển đổi số cho doanh nghiệp vừa và nhỏ tại Việt Nam..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {/* Focus Keywords */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Hash size={14} /> Focus Keywords
            </label>
            <input
              type="text"
              className="w-full p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="VD: chuyển đổi số, digital transformation, SME..."
              value={focusKeywords}
              onChange={(e) => setFocusKeywords(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1.5">Phân tách bằng dấu phẩy. AI sẽ sử dụng tự nhiên khắp bài.</p>
          </div>

          {/* Yêu cầu riêng */}
          <div>
            <label className="text-sm font-medium mb-2 block">Yêu cầu Bài viết (tuỳ chọn)</label>
            <textarea
              className="w-full h-20 p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
              placeholder="VD: Nhấn mạnh vào lợi ích A, chèn link công ty, giọng văn hài hước..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </div>

          {/* Thông tin bổ sung */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
            <p className="text-xs text-amber-800 dark:text-amber-400 flex items-start gap-2">
              <BookOpen size={14} className="flex-shrink-0 mt-0.5" />
              AI sẽ tạo bài viết Long-form (2000+ từ) chuẩn E-E-A-T với trích dẫn chuyên gia, số liệu, và đề xuất outbound links.
            </p>
          </div>

          {/* Generate Button */}
          <Button
            className="w-full py-6 text-lg rounded-xl shadow-lg group"
            onClick={handleGenerate}
            disabled={!topic || !focusKeywords || generating}
          >
            {generating ? (
              <span className="flex items-center animate-pulse">
                <Sparkles className="mr-2 h-5 w-5" /> Đang viết bài (2000+ từ)...
              </span>
            ) : (
              <span className="flex items-center">
                <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" /> Viết bài PR
              </span>
            )}
          </Button>
        </div>

        {/* RIGHT: Article Preview (3/5 width) */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-2xl border shadow-sm min-h-[600px] flex flex-col overflow-hidden">
            {/* Preview header */}
            <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={14} /> Article Preview
              </h3>
              {generatedResult && (
                <span className="text-xs text-muted-foreground font-mono">
                  {wordCount} từ
                </span>
              )}
            </div>

            {generatedResult ? (
              <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-500">
                {/* Article content */}
                <div className="flex-1 overflow-y-auto p-6 max-h-[calc(100vh-350px)]">
                  {/* SEO Meta Preview */}
                  <div className="bg-muted/30 rounded-xl p-4 mb-6 border">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">SEO Preview (Google)</h5>
                    <div className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                      {generatedResult.metaTitle}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-500 mt-0.5">
                      example.com › blog › article
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {generatedResult.metaDescription}
                    </div>
                  </div>

                  {/* Focus Keyword Badge */}
                  {generatedResult.focusKeyword && (
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <Hash size={14} className="text-primary" />
                      {generatedResult.focusKeyword.split(",").map((kw: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <h1 className="text-2xl font-bold mb-6">{generatedResult.title}</h1>

                  {/* Article body — rendered markdown */}
                  <article className="prose-sm">
                    {renderMarkdown(generatedResult.articleBody)}
                  </article>

                  {/* Outbound Links */}
                  {generatedResult.suggestedOutboundLinks && generatedResult.suggestedOutboundLinks.length > 0 && (
                    <div className="mt-8 p-4 rounded-xl border bg-muted/30">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <LinkIcon size={12} /> Outbound Links gợi ý
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {generatedResult.suggestedOutboundLinks.map((link: string, i: number) => (
                          <span key={i} className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full">
                            {link}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="p-6 border-t">
                  <Button className="w-full py-6 rounded-xl" onClick={handleSave}>
                    <Save className="mr-2 h-5 w-5" /> Lưu bản nháp
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col text-muted-foreground p-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 flex items-center justify-center mb-4">
                  <Newspaper size={24} className="text-orange-500 opacity-60" />
                </div>
                <p className="text-center max-w-sm">
                  Nhập chủ đề và focus keywords, AI sẽ viết bài PR/Blog dài hơn 2000 từ chuẩn E-E-A-T.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
