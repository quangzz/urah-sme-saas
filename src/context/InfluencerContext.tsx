"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { Influencer } from "@/types/schema";
import { firestorePaths } from "@/types/schema";

interface InfluencerContextType {
  influencers: Influencer[];
  loading: boolean;
  addInfluencer: (data: Partial<Influencer>) => Promise<string>;
  updateInfluencer: (id: string, data: Partial<Influencer>) => Promise<void>;
  deleteInfluencer: (id: string) => Promise<void>;
}

const InfluencerContext = createContext<InfluencerContextType | null>(null);

export const InfluencerProvider = ({ children }: { children: React.ReactNode }) => {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();

  useEffect(() => {
    if (!user || !db || !workspaceId) {
      setLoading(false);
      return;
    }

    const infRef = collection(db, firestorePaths.influencers(workspaceId));
    const q = query(infRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Influencer[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Influencer));
      setInfluencers(docs);
      setLoading(false);
    }, (error) => {
      console.error("[DEBUG][InfluencerContext] Error fetching influencers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, workspaceId]);

  const addInfluencer = useCallback(async (data: Partial<Influencer>) => {
    if (!db || !workspaceId) return "";
    const docData = {
      ...data,
      createdBy: user?.uid || "unknown",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, firestorePaths.influencers(workspaceId)), docData);
    return docRef.id;
  }, [user, workspaceId]);

  const updateInfluencer = useCallback(async (id: string, data: Partial<Influencer>) => {
    if (!db || !workspaceId) return;
    try {
      await updateDoc(doc(db, firestorePaths.influencer(workspaceId, id)), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[DEBUG][InfluencerContext] Error updating influencer:", e);
    }
  }, [workspaceId]);

  const deleteInfluencer = useCallback(async (id: string) => {
    if (!db || !workspaceId) return;
    try {
      await deleteDoc(doc(db, firestorePaths.influencer(workspaceId, id)));
    } catch (e) {
      console.error("[DEBUG][InfluencerContext] Error deleting influencer:", e);
    }
  }, [workspaceId]);

  return (
    <InfluencerContext.Provider value={{ influencers, loading, addInfluencer, updateInfluencer, deleteInfluencer }}>
      {children}
    </InfluencerContext.Provider>
  );
};

export const useInfluencers = () => {
  const context = useContext(InfluencerContext);
  if (!context) {
    throw new Error("useInfluencers must be used within an InfluencerProvider");
  }
  return context;
};
