"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBookingCampaigns } from "@/context/BookingCampaignContext";
import { useInfluencers } from "@/context/InfluencerContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Plus, Trash2, Handshake, UserPlus } from "lucide-react";
import type { Deliverable, SocialPlatform } from "@/types/schema";

const PLATFORMS: SocialPlatform[] = ["facebook", "instagram", "linkedin", "tiktok", "twitter"];

export default function NewBookingCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const { user } = useAuth();

  const { addCampaign } = useBookingCampaigns();
  const { influencers, addInfluencer } = useInfluencers();

  // Campaign fields
  const [campaignName, setCampaignName] = useState("");
  const [selectedInfluencerId, setSelectedInfluencerId] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [requirements, setRequirements] = useState("");
  const [notes, setNotes] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [discountCode, setDiscountCode] = useState("");

  // KOL fields (tạo mới nếu chưa có)
  const [showNewKolForm, setShowNewKolForm] = useState(false);
  const [newKolName, setNewKolName] = useState("");
  const [newKolHandle, setNewKolHandle] = useState("");
  const [newKolEmail, setNewKolEmail] = useState("");
  const [newKolFollowers, setNewKolFollowers] = useState("");

  // Financials
  const [flatFee, setFlatFee] = useState("");
  const [commissionPerTrial, setCommissionPerTrial] = useState("");
  const [currency, setCurrency] = useState("VND");

  // Deliverables
  const [deliverables, setDeliverables] = useState<Deliverable[]>([
    { format: "Post", description: "", status: "pending", deadline: "" },
  ]);

  const [saving, setSaving] = useState(false);

  const addDeliverable = () => {
    setDeliverables((prev) => [...prev, { format: "Post", description: "", status: "pending", deadline: "" }]);
  };

  const removeDeliverable = (index: number) => {
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDeliverable = (index: number, field: keyof Deliverable, value: string) => {
    setDeliverables((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const handleCreateKol = async () => {
    if (!newKolName || !newKolHandle) return;
    const kolId = await addInfluencer({
      name: newKolName,
      handle: newKolHandle,
      platform,
      contactEmail: newKolEmail,
      followerCount: parseInt(newKolFollowers) || 0,
    });
    setSelectedInfluencerId(kolId);
    setShowNewKolForm(false);
    // Reset form
    setNewKolName("");
    setNewKolHandle("");
    setNewKolEmail("");
    setNewKolFollowers("");
  };

  const handleSave = async () => {
    if (!campaignName) return;

    setSaving(true);

    // Lấy tên influencer từ danh sách hoặc từ form mới
    const selectedKol = influencers.find((inf) => inf.id === selectedInfluencerId);
    const influencerName = selectedKol?.name || newKolName || "Unknown KOL";

    try {
      await addCampaign({
        campaignName,
        influencerId: selectedInfluencerId,
        influencerName,
        platform,
        requirements,
        notes,
        trackingUrl: trackingUrl || undefined,
        discountCode: discountCode || undefined,
        financials: {
          flatFee: parseInt(flatFee) || 0,
          commissionPerTrial: parseInt(commissionPerTrial) || undefined,
          currency,
        },
        deliverables,
        workflowState: "scouting",
      });

      router.push(`/workspace/${workspaceId}/project/${projectId}/booking`);
    } catch (e) {
      console.error("[DEBUG][NewBooking] Save error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <button onClick={() => router.back()} className="flex items-center hover:text-foreground transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Quay lại Kanban
        </button>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-8 flex items-center gap-3">
        <Handshake className="text-purple-500" size={28} />
        Tạo Campaign mới
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Campaign Info */}
        <div className="space-y-6">
          {/* Tên campaign */}
          <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Thông tin Campaign</h3>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Tên Campaign *</label>
              <input
                type="text"
                className="w-full p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="VD: Summer Campaign - @kolname"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Platform</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize border transition-all ${
                      platform === p ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Yêu cầu KOL (Brief / Guidelines)</label>
              <textarea
                className="w-full h-24 p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                placeholder="VD: Cần mặc áo sơ mi trắng, nhắc đến hashtag #UrahSME..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Ghi chú nội bộ</label>
              <textarea
                className="w-full h-20 p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                placeholder="Ghi chú thêm..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* KOL Selection */}
          <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Chọn KOL / Influencer</h3>

            {influencers.length > 0 && !showNewKolForm && (
              <div>
                <select
                  className="w-full p-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
                  value={selectedInfluencerId}
                  onChange={(e) => setSelectedInfluencerId(e.target.value)}
                >
                  <option value="">-- Chọn từ danh bạ --</option>
                  {influencers.map((inf) => (
                    <option key={inf.id} value={inf.id}>
                      {inf.name} (@{inf.handle}) — {inf.platform}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!showNewKolForm ? (
              <button
                onClick={() => setShowNewKolForm(true)}
                className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
              >
                <UserPlus size={14} /> Thêm KOL mới vào danh bạ
              </button>
            ) : (
              <div className="space-y-3 p-4 rounded-xl bg-muted/30 border">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Tên KOL *</label>
                    <input type="text" className="w-full p-2.5 rounded-lg border bg-background text-sm outline-none" placeholder="Nguyễn Văn A" value={newKolName} onChange={(e) => setNewKolName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Handle *</label>
                    <input type="text" className="w-full p-2.5 rounded-lg border bg-background text-sm outline-none" placeholder="@username" value={newKolHandle} onChange={(e) => setNewKolHandle(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Email</label>
                    <input type="email" className="w-full p-2.5 rounded-lg border bg-background text-sm outline-none" placeholder="email@kol.com" value={newKolEmail} onChange={(e) => setNewKolEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Followers</label>
                    <input type="number" className="w-full p-2.5 rounded-lg border bg-background text-sm outline-none" placeholder="100000" value={newKolFollowers} onChange={(e) => setNewKolFollowers(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateKol} disabled={!newKolName || !newKolHandle}>
                    <UserPlus size={14} className="mr-1" /> Lưu KOL
                  </Button>
                  <button onClick={() => setShowNewKolForm(false)} className="text-sm text-muted-foreground hover:text-foreground">Huỷ</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Financial + Deliverables + Tracking */}
        <div className="space-y-6">
          {/* Financials */}
          <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Tài chính</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Phí cố định (Flat Fee)</label>
                <input type="number" className="w-full p-3 rounded-lg border bg-background text-sm outline-none" placeholder="5000000" value={flatFee} onChange={(e) => setFlatFee(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Đơn vị tiền</label>
                <select className="w-full p-3 rounded-lg border bg-background text-sm outline-none" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="VND">VND (₫)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Hoa hồng / Trial (tuỳ chọn)</label>
              <input type="number" className="w-full p-3 rounded-lg border bg-background text-sm outline-none" placeholder="50000" value={commissionPerTrial} onChange={(e) => setCommissionPerTrial(e.target.value)} />
            </div>
          </div>

          {/* Deliverables */}
          <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Deliverables</h3>
              <button onClick={addDeliverable} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                <Plus size={14} /> Thêm
              </button>
            </div>
            {deliverables.map((d, i) => (
              <div key={i} className="p-3 rounded-xl border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <select
                    className="p-2 rounded-lg border bg-background text-sm outline-none"
                    value={d.format}
                    onChange={(e) => updateDeliverable(i, "format", e.target.value)}
                  >
                    <option value="Post">Post</option>
                    <option value="Story">Story</option>
                    <option value="Reel">Reel</option>
                    <option value="Video">Video</option>
                    <option value="Review">Review</option>
                  </select>
                  {deliverables.length > 1 && (
                    <button onClick={() => removeDeliverable(i)} className="text-destructive p-1 rounded hover:bg-destructive/10">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="w-full p-2 rounded-lg border bg-background text-sm outline-none"
                  placeholder="Mô tả deliverable..."
                  value={d.description}
                  onChange={(e) => updateDeliverable(i, "description", e.target.value)}
                />
                <input
                  type="date"
                  className="w-full p-2 rounded-lg border bg-background text-sm outline-none"
                  value={d.deadline || ""}
                  onChange={(e) => updateDeliverable(i, "deadline", e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Tracking */}
          <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Tracking</h3>
            <div>
              <label className="text-xs font-medium mb-1 block">UTM Link</label>
              <input type="url" className="w-full p-3 rounded-lg border bg-background text-sm outline-none" placeholder="https://example.com?utm_source=kol" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Discount Code</label>
              <input type="text" className="w-full p-3 rounded-lg border bg-background text-sm outline-none" placeholder="KOL2026" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} />
            </div>
          </div>

          {/* Save Button */}
          <Button className="w-full py-6 rounded-xl text-lg shadow-lg" onClick={handleSave} disabled={!campaignName || saving}>
            {saving ? "Đang lưu..." : "Tạo Campaign"}
          </Button>
        </div>
      </div>
    </div>
  );
}
