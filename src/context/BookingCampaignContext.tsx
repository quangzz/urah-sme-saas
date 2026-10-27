"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { BookingCampaign, BookingWorkflowState } from "@/types/schema";
import { firestorePaths } from "@/types/schema";

interface BookingCampaignContextType {
  campaigns: BookingCampaign[];
  loading: boolean;
  projectId: string;
  addCampaign: (data: Partial<BookingCampaign>) => Promise<string>;
  updateCampaign: (id: string, data: Partial<BookingCampaign>) => Promise<void>;
  updateWorkflowState: (id: string, newState: BookingWorkflowState) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
}

const BookingCampaignContext = createContext<BookingCampaignContextType | null>(null);

export const BookingCampaignProvider = ({ children, projectId }: { children: React.ReactNode; projectId: string }) => {
  const [campaigns, setCampaigns] = useState<BookingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();

  useEffect(() => {
    if (!user || !db || !workspaceId || !projectId) {
      setLoading(false);
      return;
    }

    const bcRef = collection(db, firestorePaths.bookingCampaigns(workspaceId, projectId));
    const q = query(bcRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: BookingCampaign[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as BookingCampaign));
      setCampaigns(docs);
      setLoading(false);
    }, (error) => {
      console.error("[DEBUG][BookingCampaignContext] Error fetching campaigns:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, workspaceId, projectId]);

  const addCampaign = useCallback(async (data: Partial<BookingCampaign>) => {
    if (!db || !workspaceId || !projectId) return "";
    const docData = {
      ...data,
      workflowState: data.workflowState || "scouting",
      performanceMetrics: data.performanceMetrics || { clicks: 0, views: 0, demos: 0 },
      financials: data.financials || { flatFee: 0, currency: "VND" },
      deliverables: data.deliverables || [],
      createdBy: user?.uid || "unknown",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, firestorePaths.bookingCampaigns(workspaceId, projectId)), docData);
    return docRef.id;
  }, [user, workspaceId, projectId]);

  const updateCampaign = useCallback(async (id: string, data: Partial<BookingCampaign>) => {
    if (!db || !workspaceId || !projectId) return;
    try {
      await updateDoc(doc(db, firestorePaths.bookingCampaign(workspaceId, projectId, id)), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[DEBUG][BookingCampaignContext] Error updating campaign:", e);
    }
  }, [workspaceId, projectId]);

  const updateWorkflowState = useCallback(async (id: string, newState: BookingWorkflowState) => {
    return updateCampaign(id, { workflowState: newState });
  }, [updateCampaign]);

  const deleteCampaign = useCallback(async (id: string) => {
    if (!db || !workspaceId || !projectId) return;
    try {
      await deleteDoc(doc(db, firestorePaths.bookingCampaign(workspaceId, projectId, id)));
    } catch (e) {
      console.error("[DEBUG][BookingCampaignContext] Error deleting campaign:", e);
    }
  }, [workspaceId, projectId]);

  return (
    <BookingCampaignContext.Provider value={{ campaigns, loading, projectId, addCampaign, updateCampaign, updateWorkflowState, deleteCampaign }}>
      {children}
    </BookingCampaignContext.Provider>
  );
};

export const useBookingCampaigns = () => {
  const context = useContext(BookingCampaignContext);
  if (!context) {
    throw new Error("useBookingCampaigns must be used within a BookingCampaignProvider");
  }
  return context;
};
