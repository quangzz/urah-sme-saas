"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBookingCampaigns } from "@/context/BookingCampaignContext";
import { useInfluencers } from "@/context/InfluencerContext";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import type { Deliverable, SocialPlatform } from "@/types/schema";

const PLATFORMS: SocialPlatform[] = ["facebook", "instagram", "linkedin", "tiktok", "twitter"];

export default function EditBookingCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const campaignId = params.campaignId as string;

  const { campaigns, updateCampaign } = useBookingCampaigns();
  const { influencers } = useInfluencers();
  const campaign = campaigns.find((c) => c.id === campaignId);

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [selectedInfluencerId, setSelectedInfluencerId] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [requirements, setRequirements] = useState("");
  const [notes, setNotes] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [flatFee, setFlatFee] = useState("");
  const [commissionPerTrial, setCommissionPerTrial] = useState("");
  const [currency, setCurrency] = useState("VND");
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [saving, setSaving] = useState(false);

  // Pre-fill khi campaign load xong
  useEffect(() => {
    if (campaign) {
      setCampaignName(campaign.campaignName || "");
      setSelectedInfluencerId(campaign.influencerId || "");
      setPlatform(campaign.platform || "instagram");
      setRequirements(campaign.requirements || "");
      setNotes(campaign.notes || "");
      setTrackingUrl(campaign.trackingUrl || "");
      setDiscountCode(campaign.discountCode || "");
      setFlatFee(String(campaign.financials?.flatFee || ""));
      setCommissionPerTrial(String(campaign.financials?.commissionPerTrial || ""));
      setCurrency(campaign.financials?.currency || "VND");
      setDeliverables(campaign.deliverables || []);
    }
  }, [campaign]);

  if (!campaign) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Campaign không tồn tại hoặc đang tải...</p>
        <button onClick={() => router.back()} className="text-primary hover:underline mt-2 text-sm">Quay lại</button>
      </div>
    );
  }

  const addDeliverable = () => {
    setDeliverables((prev) => [...prev, { format: "Post", description: "", status: "pending", deadline: "" }]);
  };

  const removeDeliverable = (index: number) => {
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDeliverable = (index: number, field: keyof Deliverable, value: string) => {
    setDeliverables((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const handleSave = async () => {
    if (!campaignName) return;
    setSaving(true);

    const selectedKol = influencers.find((inf) => inf.id === selectedInfluencerId);
    const influencerName = selectedKol?.name || campaign.influencerName || "Unknown KOL";

    try {
      await updateCampaign(campaign.id, {
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
      });
      router.push(`/workspace/${workspaceId}/project/${projectId}/booking/${campaignId}`);
    } catch (e) {
      console.error("[DEBUG][EditBooking] Save error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <button onClick={() => router.back()} className="flex items-center hover:text-foreground transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Quay lại
        </button>
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-6">Chỉnh sửa Campaign</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT */}
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Thông tin chung</h3>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tên Campaign</label>
              <input type="text" className="w-full p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">KOL / Influencer</label>
              <select className="w-full p-3 rounded-lg border bg-background text-sm outline-none focus:ring-2 focus:ring-primary" value={selectedInfluencerId} onChange={(e) => setSelectedInfluencerId(e.target.value)}>
                <option value="">-- Chọn từ danh bạ --</option>
                {influencers.map((inf) => (
                  <option key={inf.id} value={inf.id}>{inf.name} (@{inf.handle})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Platform</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button key={p} onClick={() => setPlatform(p)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize border transition-all ${platform === p ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Yêu cầu KOL (Brief / Guidelines)</label>
              <textarea className="w-full h-20 p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none" value={requirements} onChange={(e) => setRequirements(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ghi chú</label>
              <textarea className="w-full h-20 p-3 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary outline-none resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Financials */}
          <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Tài chính</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Flat Fee</label>
                <input type="number" className="w-full p-3 rounded-lg border bg-background text-sm outline-none" value={flatFee} onChange={(e) => setFlatFee(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Đơn vị</label>
                <select className="w-full p-3 rounded-lg border bg-background text-sm outline-none" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="VND">VND (₫)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Hoa hồng / Trial</label>
              <input type="number" className="w-full p-3 rounded-lg border bg-background text-sm outline-none" value={commissionPerTrial} onChange={(e) => setCommissionPerTrial(e.target.value)} />
            </div>
          </div>

          {/* Tracking */}
          <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Tracking</h3>
            <div>
              <label className="text-xs font-medium mb-1 block">UTM Link</label>
              <input type="url" className="w-full p-3 rounded-lg border bg-background text-sm outline-none" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Discount Code</label>
              <input type="text" className="w-full p-3 rounded-lg border bg-background text-sm outline-none" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} />
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
                  <select className="p-2 rounded-lg border bg-background text-sm outline-none" value={d.format} onChange={(e) => updateDeliverable(i, "format", e.target.value)}>
                    <option value="Post">Post</option>
                    <option value="Story">Story</option>
                    <option value="Reel">Reel</option>
                    <option value="Video">Video</option>
                    <option value="Review">Review</option>
                  </select>
                  {deliverables.length > 1 && (
                    <button onClick={() => removeDeliverable(i)} className="text-destructive p-1 rounded hover:bg-destructive/10"><Trash2 size={14} /></button>
                  )}
                </div>
                <input type="text" className="w-full p-2 rounded-lg border bg-background text-sm outline-none" placeholder="Mô tả..." value={d.description} onChange={(e) => updateDeliverable(i, "description", e.target.value)} />
                <input type="date" className="w-full p-2 rounded-lg border bg-background text-sm outline-none" value={d.deadline || ""} onChange={(e) => updateDeliverable(i, "deadline", e.target.value)} />
              </div>
            ))}
          </div>

          <Button className="w-full py-6 rounded-xl text-lg" onClick={handleSave} disabled={!campaignName || saving}>
            <Save size={18} className="mr-2" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
