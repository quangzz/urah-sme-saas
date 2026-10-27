"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { SocialContent, ContentStatus } from "@/types/schema";
import { firestorePaths } from "@/types/schema";

interface SocialContentContextType {
  socialContents: SocialContent[];
  loading: boolean;
  projectId: string;
  addPost: (data: Partial<SocialContent>) => Promise<string>;
  updatePostStatus: (id: string, status: ContentStatus) => Promise<void>;
  updatePost: (id: string, data: Partial<SocialContent>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
}

const SocialContentContext = createContext<SocialContentContextType | null>(null);

export const SocialContentProvider = ({ children, projectId }: { children: React.ReactNode; projectId: string }) => {
  const [socialContents, setSocialContents] = useState<SocialContent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();

  useEffect(() => {
    if (!user || !db || !workspaceId || !projectId) {
      setLoading(false);
      return;
    }

    const scRef = collection(db, firestorePaths.socialContents(workspaceId, projectId));
    const q = query(scRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: SocialContent[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as SocialContent));
      setSocialContents(docs);
      setLoading(false);
    }, (error) => {
      console.error("[DEBUG][SocialContentContext] Error fetching social contents:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, workspaceId, projectId]);

  const addPost = useCallback(async (data: Partial<SocialContent>) => {
    if (!db || !workspaceId || !projectId) return "";
    const docData = {
      ...data,
      status: data.status || "draft",
      createdBy: user?.uid || "unknown",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, firestorePaths.socialContents(workspaceId, projectId)), docData);
    return docRef.id;
  }, [user, workspaceId, projectId]);

  const updatePost = useCallback(async (id: string, data: Partial<SocialContent>) => {
    if (!db || !workspaceId || !projectId) return;
    try {
      await updateDoc(doc(db, firestorePaths.socialContent(workspaceId, projectId, id)), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[DEBUG][SocialContentContext] Error updating social post:", e);
    }
  }, [workspaceId, projectId]);

  const updatePostStatus = useCallback(async (id: string, status: ContentStatus) => {
    return updatePost(id, { status });
  }, [updatePost]);

  const deletePost = useCallback(async (id: string) => {
    if (!db || !workspaceId || !projectId) return;
    try {
      await deleteDoc(doc(db, firestorePaths.socialContent(workspaceId, projectId, id)));
    } catch (e) {
      console.error("[DEBUG][SocialContentContext] Error deleting social post:", e);
    }
  }, [workspaceId, projectId]);

  return (
    <SocialContentContext.Provider value={{ socialContents, loading, projectId, addPost, updatePost, updatePostStatus, deletePost }}>
      {children}
    </SocialContentContext.Provider>
  );
};

export const useSocialContent = () => {
  const context = useContext(SocialContentContext);
  if (!context) {
    throw new Error("useSocialContent must be used within a SocialContentProvider");
  }
  return context;
};
