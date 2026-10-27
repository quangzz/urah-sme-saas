"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBookingCampaigns } from "@/context/BookingCampaignContext";
import { Button } from "@/components/ui/Button";
import { Plus, Handshake, Search, Eye, MousePointerClick, Users, DollarSign } from "lucide-react";
import type { BookingCampaign, BookingWorkflowState } from "@/types/schema";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";

// Cấu hình cột Kanban
const COLUMNS: { id: BookingWorkflowState; label: string; emoji: string; color: string }[] = [
  { id: "scouting", label: "Scouting", emoji: "🔍", color: "text-amber-600" },
  { id: "negotiating", label: "Negotiating", emoji: "💬", color: "text-blue-600" },
  { id: "live", label: "Live", emoji: "🟢", color: "text-green-600" },
  { id: "completed", label: "Completed", emoji: "✅", color: "text-emerald-700" },
  { id: "cancelled", label: "Cancelled", emoji: "❌", color: "text-red-500" },
];

// Format tiền VND
function formatCurrency(amount: number, currency: string = "VND") {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

// ── Draggable Card ──────────────────────────────────────────────
function CampaignCard({ campaign, onClick }: { campaign: BookingCampaign; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: campaign.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const completedDeliverables = campaign.deliverables?.filter((d) => d.status === "completed").length || 0;
  const totalDeliverables = campaign.deliverables?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-card p-4 rounded-xl border hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${isDragging ? "opacity-50 shadow-xl ring-2 ring-primary" : ""}`}
      onClick={(e) => {
        // Chỉ navigate nếu không kéo
        if (!isDragging) onClick();
      }}
    >
      {/* Header: KOL name + platform */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {campaign.influencerName?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <span className="font-medium text-sm truncate">{campaign.influencerName || "Unknown KOL"}</span>
        </div>
        <span className="text-xs px-2 py-0.5 bg-accent rounded-full capitalize flex-shrink-0">
          {campaign.platform}
        </span>
      </div>

      {/* Campaign name */}
      <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{campaign.campaignName}</p>

      {/* Metrics mini */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1" title="Views">
          <Eye size={11} /> {campaign.performanceMetrics?.views || 0}
        </span>
        <span className="flex items-center gap-1" title="Clicks">
          <MousePointerClick size={11} /> {campaign.performanceMetrics?.clicks || 0}
        </span>
        <span className="flex items-center gap-1" title="Demos">
          <Users size={11} /> {campaign.performanceMetrics?.demos || 0}
        </span>
      </div>

      {/* Footer: cost + deliverables progress */}
      <div className="flex items-center justify-between pt-2 border-t text-xs">
        <span className="font-medium text-primary flex items-center gap-1">
          <DollarSign size={11} />
          {formatCurrency(campaign.financials?.flatFee || 0, campaign.financials?.currency)}
        </span>
        {totalDeliverables > 0 && (
          <span className="text-muted-foreground">
            {completedDeliverables}/{totalDeliverables} deliverables
          </span>
        )}
      </div>
    </div>
  );
}

// ── Droppable Column ────────────────────────────────────────────
function KanbanColumn({
  column,
  campaigns,
  onCardClick,
}: {
  column: (typeof COLUMNS)[number];
  campaigns: BookingCampaign[];
  onCardClick: (id: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[260px] max-w-[320px] flex flex-col rounded-2xl p-3 transition-colors ${
        isOver ? "bg-primary/10 ring-2 ring-primary/30" : "bg-muted/30"
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <h3 className={`font-semibold text-sm flex items-center gap-1.5 ${column.color}`}>
          <span>{column.emoji}</span> {column.label}
          <span className="ml-1 bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full text-xs">
            {campaigns.length}
          </span>
        </h3>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {campaigns.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground text-xs border-2 border-dashed rounded-xl">
            Kéo campaign vào đây
          </div>
        ) : (
          campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} onClick={() => onCardClick(c.id)} />
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function BookingKanbanPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  const { campaigns, loading, updateWorkflowState } = useBookingCampaigns();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Đang tải campaigns...</div>;
  }

  // Summary stats
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.financials?.flatFee || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.performanceMetrics?.clicks || 0), 0);
  const totalViews = campaigns.reduce((sum, c) => sum + (c.performanceMetrics?.views || 0), 0);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const campaignId = active.id as string;
    const newState = over.id as BookingWorkflowState;

    // Chỉ update nếu state thực sự thay đổi
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (campaign && campaign.workflowState !== newState) {
      updateWorkflowState(campaignId, newState);
    }
  };

  const activeCampaign = activeDragId ? campaigns.find((c) => c.id === activeDragId) : null;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-3">
            <Handshake className="text-purple-500" size={28} />
            KOL Booking
          </h1>
          <p className="text-muted-foreground">Quản trị campaign KOL/Influencer theo quy trình Kanban.</p>
        </div>
        <Button onClick={() => router.push(`/workspace/${workspaceId}/project/${projectId}/booking/new`)}>
          <Plus className="mr-2 h-4 w-4" /> Tạo Campaign
        </Button>
      </div>

      {/* Summary bar */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Handshake size={18} className="text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tổng campaigns</div>
              <div className="font-bold">{campaigns.length}</div>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign size={18} className="text-green-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tổng ngân sách</div>
              <div className="font-bold text-sm">{formatCurrency(totalBudget)}</div>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Eye size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tổng views</div>
              <div className="font-bold">{totalViews.toLocaleString()}</div>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <MousePointerClick size={18} className="text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tổng clicks</div>
              <div className="font-bold">{totalClicks.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {campaigns.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
            <Handshake size={28} className="text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Chưa có campaign nào</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Bắt đầu tạo campaign booking KOL/Influencer đầu tiên cho dự án.</p>
          <Button onClick={() => router.push(`/workspace/${workspaceId}/project/${projectId}/booking/new`)}>
            <Plus className="mr-2 h-4 w-4" /> Tạo Campaign đầu tiên
          </Button>
        </div>
      ) : (
        /* Kanban Board */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-320px)]">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                campaigns={campaigns.filter((c) => c.workflowState === col.id)}
                onCardClick={(id) => router.push(`/workspace/${workspaceId}/project/${projectId}/booking/${id}`)}
              />
            ))}
          </div>

          {/* Drag Overlay — ghost card khi đang kéo */}
          <DragOverlay>
            {activeCampaign ? (
              <div className="bg-card p-4 rounded-xl border shadow-2xl ring-2 ring-primary opacity-90 w-[280px]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    {activeCampaign.influencerName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span className="font-medium text-sm">{activeCampaign.influencerName}</span>
                </div>
                <p className="text-xs text-muted-foreground">{activeCampaign.campaignName}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
