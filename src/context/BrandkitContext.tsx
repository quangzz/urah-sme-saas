"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { Brandkit } from "@/types/schema";
import { firestorePaths } from "@/types/schema";

interface BrandkitContextType {
  brandkits: Brandkit[];
  loading: boolean;
  projectId: string;
  addBrandkit: (data: Partial<Brandkit>) => Promise<string>;
  updateBrandkit: (id: string, data: Partial<Brandkit>) => Promise<void>;
  deleteBrandkit: (id: string) => Promise<void>;
  setPrimaryBrandkit: (id: string) => Promise<void>;
}

const BrandkitContext = createContext<BrandkitContextType | null>(null);

export const BrandkitProvider = ({ children, projectId }: { children: React.ReactNode; projectId: string }) => {
  const [brandkits, setBrandkits] = useState<Brandkit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();

  useEffect(() => {
    if (!user || !db || !workspaceId || !projectId) {
      setLoading(false);
      return;
    }

    const brandkitsRef = collection(db, firestorePaths.brandkits(workspaceId, projectId));
    const q = query(brandkitsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bks: Brandkit[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Brandkit));
      setBrandkits(bks);
      setLoading(false);
    }, (error) => {
      console.error("[DEBUG][BrandkitContext] Error fetching brandkits:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, workspaceId, projectId]);

  const addBrandkit = useCallback(async (data: Partial<Brandkit>) => {
    if (!db || !workspaceId || !projectId) return "";
    const docData = {
      ...data,
      isPrimary: brandkits.length === 0, // Auto set primary if it's the first
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, firestorePaths.brandkits(workspaceId, projectId)), docData);
    return docRef.id;
  }, [workspaceId, projectId, brandkits.length]);

  const updateBrandkit = useCallback(async (id: string, data: Partial<Brandkit>) => {
    if (!db || !workspaceId || !projectId) return;
    try {
      await updateDoc(doc(db, firestorePaths.brandkit(workspaceId, projectId, id)), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[DEBUG][BrandkitContext] Error updating brandkit:", e);
    }
  }, [workspaceId, projectId]);

  const deleteBrandkit = useCallback(async (id: string) => {
    if (!db || !workspaceId || !projectId) return;
    try {
      await deleteDoc(doc(db, firestorePaths.brandkit(workspaceId, projectId, id)));
    } catch (e) {
      console.error("[DEBUG][BrandkitContext] Error deleting brandkit:", e);
    }
  }, [workspaceId, projectId]);

  const setPrimaryBrandkit = useCallback(async (targetId: string) => {
    if (!db || !workspaceId || !projectId) return;
    // We should ideally use a batch here, but iterating works for small lists
    try {
      brandkits.forEach(async (bk) => {
        if (bk.id === targetId && !bk.isPrimary) {
          await updateBrandkit(bk.id, { isPrimary: true });
        } else if (bk.id !== targetId && bk.isPrimary) {
          await updateBrandkit(bk.id, { isPrimary: false });
        }
      });
    } catch (e) {
      console.error("[DEBUG][BrandkitContext] Error setting primary brandkit:", e);
    }
  }, [workspaceId, projectId, brandkits, updateBrandkit]);

  return (
    <BrandkitContext.Provider value={{ brandkits, loading, projectId, addBrandkit, updateBrandkit, deleteBrandkit, setPrimaryBrandkit }}>
      {children}
    </BrandkitContext.Provider>
  );
};

export const useBrandkits = () => {
  const context = useContext(BrandkitContext);
  if (!context) {
    throw new Error("useBrandkits must be used within a BrandkitProvider");
  }
  return context;
};
