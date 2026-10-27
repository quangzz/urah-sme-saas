"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { PrArticle, ContentStatus } from "@/types/schema";
import { firestorePaths } from "@/types/schema";

interface PRContentContextType {
  prArticles: PrArticle[];
  loading: boolean;
  projectId: string;
  addPRArticle: (data: Partial<PrArticle>) => Promise<string>;
  updatePRArticle: (id: string, data: Partial<PrArticle>) => Promise<void>;
  updatePRStatus: (id: string, status: ContentStatus) => Promise<void>;
  deletePRArticle: (id: string) => Promise<void>;
}

const PRContentContext = createContext<PRContentContextType | null>(null);

export const PRContentProvider = ({ children, projectId }: { children: React.ReactNode; projectId: string }) => {
  const [prArticles, setPrArticles] = useState<PrArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();

  useEffect(() => {
    if (!user || !db || !workspaceId || !projectId) {
      setLoading(false);
      return;
    }

    const prRef = collection(db, firestorePaths.prArticles(workspaceId, projectId));
    const q = query(prRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: PrArticle[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as PrArticle));
      setPrArticles(docs);
      setLoading(false);
    }, (error) => {
      console.error("[DEBUG][PRContentContext] Error fetching PR articles:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, workspaceId, projectId]);

  const addPRArticle = useCallback(async (data: Partial<PrArticle>) => {
    if (!db || !workspaceId || !projectId) return "";
    const docData = {
      ...data,
      status: data.status || "draft",
      createdBy: user?.uid || "unknown",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, firestorePaths.prArticles(workspaceId, projectId)), docData);
    return docRef.id;
  }, [user, workspaceId, projectId]);

  const updatePRArticle = useCallback(async (id: string, data: Partial<PrArticle>) => {
    if (!db || !workspaceId || !projectId) return;
    try {
      await updateDoc(doc(db, firestorePaths.prArticle(workspaceId, projectId, id)), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[DEBUG][PRContentContext] Error updating PR article:", e);
    }
  }, [workspaceId, projectId]);

  const updatePRStatus = useCallback(async (id: string, status: ContentStatus) => {
    return updatePRArticle(id, { status });
  }, [updatePRArticle]);

  const deletePRArticle = useCallback(async (id: string) => {
    if (!db || !workspaceId || !projectId) return;
    try {
      await deleteDoc(doc(db, firestorePaths.prArticle(workspaceId, projectId, id)));
    } catch (e) {
      console.error("[DEBUG][PRContentContext] Error deleting PR article:", e);
    }
  }, [workspaceId, projectId]);

  return (
    <PRContentContext.Provider value={{ prArticles, loading, projectId, addPRArticle, updatePRArticle, updatePRStatus, deletePRArticle }}>
      {children}
    </PRContentContext.Provider>
  );
};

export const usePRContent = () => {
  const context = useContext(PRContentContext);
  if (!context) {
    throw new Error("usePRContent must be used within a PRContentProvider");
  }
  return context;
};
