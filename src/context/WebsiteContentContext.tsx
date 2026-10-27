"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { WebsiteContent, ContentStatus } from "@/types/schema";
import { firestorePaths } from "@/types/schema";

interface WebsiteContentContextType {
  websiteContents: WebsiteContent[];
  loading: boolean;
  projectId: string;
  addWebsiteContent: (data: Partial<WebsiteContent>) => Promise<string>;
  updateWebsiteContent: (id: string, data: Partial<WebsiteContent>) => Promise<void>;
  updateWebsiteStatus: (id: string, status: ContentStatus) => Promise<void>;
  deleteWebsiteContent: (id: string) => Promise<void>;
}

const WebsiteContentContext = createContext<WebsiteContentContextType | null>(null);

export const WebsiteContentProvider = ({ children, projectId }: { children: React.ReactNode; projectId: string }) => {
  const [websiteContents, setWebsiteContents] = useState<WebsiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();

  useEffect(() => {
    if (!user || !db || !workspaceId || !projectId) {
      setLoading(false);
      return;
    }

    const wcRef = collection(db, firestorePaths.websiteContents(workspaceId, projectId));
    const q = query(wcRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: WebsiteContent[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as WebsiteContent));
      setWebsiteContents(docs);
      setLoading(false);
    }, (error) => {
      console.error("[DEBUG][WebsiteContentContext] Error fetching website contents:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, workspaceId, projectId]);

  const addWebsiteContent = useCallback(async (data: Partial<WebsiteContent>) => {
    if (!db || !workspaceId || !projectId) return "";
    const docData = {
      ...data,
      status: data.status || "draft",
      createdBy: user?.uid || "unknown",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, firestorePaths.websiteContents(workspaceId, projectId)), docData);
    return docRef.id;
  }, [user, workspaceId, projectId]);

  const updateWebsiteContent = useCallback(async (id: string, data: Partial<WebsiteContent>) => {
    if (!db || !workspaceId || !projectId) return;
    try {
      await updateDoc(doc(db, firestorePaths.websiteContent(workspaceId, projectId, id)), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[DEBUG][WebsiteContentContext] Error updating website content:", e);
    }
  }, [workspaceId, projectId]);

  const updateWebsiteStatus = useCallback(async (id: string, status: ContentStatus) => {
    return updateWebsiteContent(id, { status });
  }, [updateWebsiteContent]);

  const deleteWebsiteContent = useCallback(async (id: string) => {
    if (!db || !workspaceId || !projectId) return;
    try {
      await deleteDoc(doc(db, firestorePaths.websiteContent(workspaceId, projectId, id)));
    } catch (e) {
      console.error("[DEBUG][WebsiteContentContext] Error deleting website content:", e);
    }
  }, [workspaceId, projectId]);

  return (
    <WebsiteContentContext.Provider value={{ websiteContents, loading, projectId, addWebsiteContent, updateWebsiteContent, updateWebsiteStatus, deleteWebsiteContent }}>
      {children}
    </WebsiteContentContext.Provider>
  );
};

export const useWebsiteContent = () => {
  const context = useContext(WebsiteContentContext);
  if (!context) {
    throw new Error("useWebsiteContent must be used within a WebsiteContentProvider");
  }
  return context;
};
