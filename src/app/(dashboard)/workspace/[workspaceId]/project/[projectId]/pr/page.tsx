"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePRContent } from "@/context/PRContentContext";
import { Button } from "@/components/ui/Button";
import { Plus, Newspaper, Trash2, CheckCircle, Eye, BookOpen, Search } from "lucide-react";

export default function PRArticlesPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  const { prArticles, loading, updatePRStatus, deletePRArticle } = usePRContent();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Đang tải bài viết PR...</div>;
  }

  // Lọc theo search (nếu có)
  const filtered = searchQuery
    ? prArticles.filter(
        (pr) =>
          pr.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pr.pressReleaseBody?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : prArticles;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deletePRArticle(id);
    setDeletingId(null);
  };

  // Status badge
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

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <Newspaper className="text-orange-500" size={28} />
            PR Articles & Blog
          </h1>
          <p className="text-muted-foreground">Quản trị bài viết PR, Blog chuẩn SEO E-E-A-T dạng Long-form.</p>
        </div>
        <Button onClick={() => router.push(`/workspace/${workspaceId}/project/${projectId}/pr/new`)}>
          <Plus className="mr-2 h-4 w-4" /> Viết bài mới
        </Button>
      </div>

      {/* Search bar */}
      {prArticles.length > 0 && (
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Empty state */}
      {prArticles.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 flex items-center justify-center">
            <Newspaper size={28} className="text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Chưa có bài viết PR nào</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Bắt đầu tạo bài viết PR/Blog dài chuẩn E-E-A-T, tối ưu SEO sâu với AI chuyên gia.</p>
          <Button onClick={() => router.push(`/workspace/${workspaceId}/project/${projectId}/pr/new`)}>
            <Plus className="mr-2 h-4 w-4" /> Viết bài đầu tiên
          </Button>
        </div>
      ) : (
        /* Article List */
        <div className="space-y-3">
          {filtered.map((pr) => (
            <div
              key={pr.id}
              className="bg-card p-5 rounded-xl border hover:shadow-lg hover:border-primary/20 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={pr.status} />
                    {pr.authorInfo?.name && (
                      <span className="text-xs text-muted-foreground">bởi {pr.authorInfo.name}</span>
                    )}
                  </div>

                  <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {pr.headline || "Untitled Article"}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {pr.pressReleaseBody
                      ? pr.pressReleaseBody.replace(/[#*>\-_]/g, "").substring(0, 200) + "..."
                      : "Nội dung đang chờ tạo..."}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {pr.pressReleaseBody
                        ? `${pr.pressReleaseBody.split(/\s+/).length} từ`
                        : "0 từ"}
                    </span>
                    <span>
                      {pr.createdAt
                        ? new Date((pr.createdAt as any).seconds * 1000).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Vừa tạo"}
                    </span>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {pr.status === "draft" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updatePRStatus(pr.id, "approved"); }}
                      className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 transition-colors"
                      title="Duyệt bài"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {pr.status === "approved" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updatePRStatus(pr.id, "published"); }}
                      className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 transition-colors"
                      title="Xuất bản"
                    >
                      <Eye size={18} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(pr.id); }}
                    disabled={deletingId === pr.id}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    title="Xóa bài"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy bài viết nào cho &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
