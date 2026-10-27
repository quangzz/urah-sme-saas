"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWebsiteContent } from "@/context/WebsiteContentContext";
import { Button } from "@/components/ui/Button";
import { Plus, Globe, Eye, Code2, Trash2, CheckCircle } from "lucide-react";

export default function WebsiteContentPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  const { websiteContents, loading, updateWebsiteStatus, deleteWebsiteContent } = useWebsiteContent();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Đang tải nội dung Website...</div>;
  }

  // Nhóm theo status
  const drafts = websiteContents.filter(wc => wc.status === "draft");
  const approved = websiteContents.filter(wc => wc.status === "approved");
  const published = websiteContents.filter(wc => wc.status === "published");

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteWebsiteContent(id);
    setDeletingId(null);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      draft: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    };
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors[status] || "bg-muted text-muted-foreground"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Card component cho mỗi website content
  const ContentCard = ({ item }: { item: any }) => {
    // Parse metaData an toàn
    const metaTitle = item.metaData?.title || "Untitled Page";
    const metaDesc = item.metaData?.description || "";

    return (
      <div className="bg-card p-5 rounded-xl border hover:shadow-lg hover:border-primary/20 transition-all group relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Globe size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm line-clamp-1">{metaTitle}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{metaDesc}</p>
            </div>
          </div>
          <StatusBadge status={item.status} />
        </div>

        {/* Content preview */}
        {item.contentBody && (
          <div className="text-xs text-muted-foreground line-clamp-2 mb-3 bg-muted/50 p-2 rounded-lg font-mono">
            {item.contentBody.substring(0, 150)}...
          </div>
        )}

        {/* JSON-LD indicator */}
        {item.structuredSchema && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mb-3">
            <Code2 size={12} />
            <span>JSON-LD Schema đính kèm</span>
          </div>
        )}

        {/* Footer: actions */}
        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
          <span>
            {item.createdAt
              ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" })
              : "Vừa tạo"}
          </span>
          <div className="flex items-center gap-2">
            {item.status === "draft" && (
              <button
                onClick={() => updateWebsiteStatus(item.id, "approved")}
                className="text-primary hover:underline font-medium flex items-center gap-1"
              >
                <CheckCircle size={12} /> Duyệt
              </button>
            )}
            {item.status === "approved" && (
              <button
                onClick={() => updateWebsiteStatus(item.id, "published")}
                className="text-green-600 hover:underline font-medium flex items-center gap-1"
              >
                <Eye size={12} /> Xuất bản
              </button>
            )}
            <button
              onClick={() => handleDelete(item.id)}
              disabled={deletingId === item.id}
              className="text-destructive hover:underline font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={12} /> Xóa
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <Globe className="text-blue-500" size={28} />
            Website Content
          </h1>
          <p className="text-muted-foreground">Tạo và quản lý nội dung trang web chuẩn SEO kèm JSON-LD Schema.</p>
        </div>
        <Button onClick={() => router.push(`/workspace/${workspaceId}/project/${projectId}/website/new`)}>
          <Plus className="mr-2 h-4 w-4" /> Tạo mới
        </Button>
      </div>

      {/* Empty state */}
      {websiteContents.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
            <Globe size={28} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Chưa có nội dung Website nào</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Bắt đầu tạo nội dung Landing Page, About Us hoặc bất kỳ trang nào kèm cấu trúc SEO chuẩn JSON-LD.</p>
          <Button onClick={() => router.push(`/workspace/${workspaceId}/project/${projectId}/website/new`)}>
            <Plus className="mr-2 h-4 w-4" /> Tạo trang đầu tiên
          </Button>
        </div>
      ) : (
        /* Content Grid */
        <div className="space-y-8">
          {/* Drafts */}
          {drafts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Bản nháp ({drafts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {drafts.map(wc => <ContentCard key={wc.id} item={wc} />)}
              </div>
            </div>
          )}

          {/* Approved */}
          {approved.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-600 mb-3">
                Đã duyệt ({approved.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {approved.map(wc => <ContentCard key={wc.id} item={wc} />)}
              </div>
            </div>
          )}

          {/* Published */}
          {published.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-green-600 mb-3">
                Đã xuất bản ({published.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {published.map(wc => <ContentCard key={wc.id} item={wc} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
