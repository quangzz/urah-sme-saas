"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBookingCampaigns } from "@/context/BookingCampaignContext";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Edit2, Trash2, Eye, MousePointerClick, Users, DollarSign, CheckCircle, ExternalLink, Tag, Clock } from "lucide-react";
import type { BookingWorkflowState } from "@/types/schema";

// Workflow state config
const STATES: { id: BookingWorkflowState; label: string; emoji: string; color: string; bg: string }[] = [
  { id: "scouting", label: "Scouting", emoji: "🔍", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
  { id: "negotiating", label: "Negotiating", emoji: "💬", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  { id: "live", label: "Live", emoji: "🟢", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
  { id: "completed", label: "Completed", emoji: "✅", color: "text-emerald-700", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  { id: "cancelled", label: "Cancelled", emoji: "❌", color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" },
];

function formatCurrency(amount: number, currency: string = "VND") {
  if (currency === "VND") return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const campaignId = params.campaignId as string;

  const { campaigns, updateCampaign, updateWorkflowState, deleteCampaign } = useBookingCampaigns();
  const campaign = campaigns.find((c) => c.id === campaignId);

  // Metrics edit state
  const [editingMetrics, setEditingMetrics] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [views, setViews] = useState(0);
  const [demos, setDemos] = useState(0);

  if (!campaign) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Campaign không tồn tại hoặc đang tải...</p>
        <button onClick={() => router.back()} className="text-primary hover:underline mt-2 text-sm">Quay lại</button>
      </div>
    );
  }

  const currentStateIndex = STATES.findIndex((s) => s.id === campaign.workflowState);
  const currentState = STATES[currentStateIndex];

  // Lấy next state hợp lệ
  const getNextState = (): BookingWorkflowState | null => {
    const flow: BookingWorkflowState[] = ["scouting", "negotiating", "live", "completed"];
    const idx = flow.indexOf(campaign.workflowState);
    if (idx >= 0 && idx < flow.length - 1) return flow[idx + 1];
    return null;
  };

  const nextState = getNextState();
  const nextStateConfig = nextState ? STATES.find((s) => s.id === nextState) : null;

  const handleStartMetricsEdit = () => {
    setClicks(campaign.performanceMetrics?.clicks || 0);
    setViews(campaign.performanceMetrics?.views || 0);
    setDemos(campaign.performanceMetrics?.demos || 0);
    setEditingMetrics(true);
  };

  const handleSaveMetrics = async () => {
    await updateCampaign(campaign.id, {
      performanceMetrics: { clicks, views, demos },
    });
    setEditingMetrics(false);
  };

  const handleToggleDeliverable = async (index: number) => {
    const updated = campaign.deliverables.map((d, i) =>
      i === index ? { ...d, status: d.status === "completed" ? "pending" as const : "completed" as const } : d
    );
    await updateCampaign(campaign.id, { deliverables: updated });
  };

  const handleDelete = async () => {
    if (confirm("Bạn có chắc muốn xóa campaign này?")) {
      await deleteCampaign(campaign.id);
      router.push(`/workspace/${workspaceId}/project/${projectId}/booking`);
    }
  };

  const completedCount = campaign.deliverables?.filter((d) => d.status === "completed").length || 0;
  const totalCount = campaign.deliverables?.length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
        <button onClick={() => router.back()} className="flex items-center hover:text-foreground transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Quay lại Kanban
        </button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/workspace/${workspaceId}/project/${projectId}/booking/${campaignId}/edit`)}>
            <Edit2 size={14} className="mr-1" /> Chỉnh sửa
          </Button>
          <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Campaign Header */}
      <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{campaign.campaignName}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  {campaign.influencerName?.charAt(0)?.toUpperCase()}
                </div>
                <span className="font-medium text-foreground">{campaign.influencerName}</span>
              </div>
              <span>•</span>
              <span className="capitalize">{campaign.platform}</span>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${currentState?.bg} ${currentState?.color}`}>
            {currentState?.emoji} {currentState?.label}
          </span>
        </div>

        {/* Workflow Timeline */}
        <div className="flex items-center gap-1 mt-4">
          {STATES.filter((s) => s.id !== "cancelled").map((state, i) => {
            const isCompleted = i <= currentStateIndex && campaign.workflowState !== "cancelled";
            const isCurrent = state.id === campaign.workflowState;
            return (
              <React.Fragment key={state.id}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isCompleted ? `${state.bg} ${state.color}` : "bg-muted text-muted-foreground"
                } ${isCurrent ? "ring-2 ring-primary ring-offset-1" : ""}`}>
                  <span>{state.emoji}</span>
                  <span className="hidden sm:inline">{state.label}</span>
                </div>
                {i < 3 && <div className={`flex-1 h-0.5 ${isCompleted && i < currentStateIndex ? "bg-primary" : "bg-muted"}`} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Action: next state */}
        {nextState && campaign.workflowState !== "cancelled" && (
          <div className="mt-4 pt-4 border-t flex gap-2">
            <Button onClick={() => updateWorkflowState(campaign.id, nextState)}>
              Chuyển sang {nextStateConfig?.emoji} {nextStateConfig?.label}
            </Button>
            {campaign.workflowState !== "completed" && (
              <Button variant="outline" onClick={() => updateWorkflowState(campaign.id, "cancelled")} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                ❌ Huỷ Campaign
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Performance Metrics</h3>
            {!editingMetrics ? (
              <button onClick={handleStartMetricsEdit} className="text-primary text-sm font-medium hover:underline">Cập nhật</button>
            ) : (
              <button onClick={handleSaveMetrics} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                <CheckCircle size={14} /> Lưu
              </button>
            )}
          </div>

          {editingMetrics ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Eye size={16} className="text-blue-500 flex-shrink-0" />
                <input type="number" className="flex-1 p-2 rounded-lg border bg-background text-sm outline-none" value={views} onChange={(e) => setViews(parseInt(e.target.value) || 0)} />
                <span className="text-xs text-muted-foreground">views</span>
              </div>
              <div className="flex items-center gap-3">
                <MousePointerClick size={16} className="text-amber-500 flex-shrink-0" />
                <input type="number" className="flex-1 p-2 rounded-lg border bg-background text-sm outline-none" value={clicks} onChange={(e) => setClicks(parseInt(e.target.value) || 0)} />
                <span className="text-xs text-muted-foreground">clicks</span>
              </div>
              <div className="flex items-center gap-3">
                <Users size={16} className="text-green-500 flex-shrink-0" />
                <input type="number" className="flex-1 p-2 rounded-lg border bg-background text-sm outline-none" value={demos} onChange={(e) => setDemos(parseInt(e.target.value) || 0)} />
                <span className="text-xs text-muted-foreground">demos</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <Eye size={20} className="mx-auto mb-1 text-blue-500" />
                <div className="font-bold text-lg">{(campaign.performanceMetrics?.views || 0).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <MousePointerClick size={20} className="mx-auto mb-1 text-amber-500" />
                <div className="font-bold text-lg">{(campaign.performanceMetrics?.clicks || 0).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Clicks</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <Users size={20} className="mx-auto mb-1 text-green-500" />
                <div className="font-bold text-lg">{(campaign.performanceMetrics?.demos || 0).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Demos</div>
              </div>
            </div>
          )}
        </div>

        {/* Finance Summary */}
        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <h3 className="font-semibold mb-4">Tài chính</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign size={14} /> Phí cố định</span>
              <span className="font-bold">{formatCurrency(campaign.financials?.flatFee || 0, campaign.financials?.currency)}</span>
            </div>
            {campaign.financials?.commissionPerTrial && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <span className="text-sm text-muted-foreground">Hoa hồng / Trial</span>
                <span className="font-medium">{formatCurrency(campaign.financials.commissionPerTrial, campaign.financials?.currency)}</span>
              </div>
            )}
            {campaign.trackingUrl && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 overflow-hidden">
                <span className="text-sm text-muted-foreground flex items-center gap-2"><ExternalLink size={14} /> UTM Link</span>
                <a href={campaign.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm truncate max-w-[200px] hover:underline">{campaign.trackingUrl}</a>
              </div>
            )}
            {campaign.discountCode && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <span className="text-sm text-muted-foreground flex items-center gap-2"><Tag size={14} /> Discount Code</span>
                <span className="font-mono font-bold text-primary">{campaign.discountCode}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deliverables */}
      <div className="bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Deliverables ({completedCount}/{totalCount})</h3>
          {totalCount > 0 && (
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }} />
            </div>
          )}
        </div>
        {campaign.deliverables?.length > 0 ? (
          <div className="space-y-2">
            {campaign.deliverables.map((d, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${d.status === "completed" ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "hover:bg-muted/30"}`}>
                <button onClick={() => handleToggleDeliverable(i)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${d.status === "completed" ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30 hover:border-primary"}`}>
                  {d.status === "completed" && <CheckCircle size={12} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-accent rounded font-medium">{d.format}</span>
                    <span className={`text-sm ${d.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{d.description || "Không có mô tả"}</span>
                  </div>
                </div>
                {d.deadline && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                    <Clock size={11} /> {new Date(d.deadline).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Chưa có deliverable nào.</p>
        )}
      </div>

      {/* Requirements */}
      {campaign.requirements && (
        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <h3 className="font-semibold mb-2">Yêu cầu KOL (Brief / Guidelines)</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaign.requirements}</p>
        </div>
      )}

      {/* Notes */}
      {campaign.notes && (
        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <h3 className="font-semibold mb-2">Ghi chú</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaign.notes}</p>
        </div>
      )}
    </div>
  );
}
