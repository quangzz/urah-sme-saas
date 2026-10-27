"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import type { Workspace, AiQuota } from "@/types/schema";

interface WorkspaceContextType {
  workspace: Workspace | null;
  workspaceId: string;
  loading: boolean;
  aiQuota: AiQuota;
}

const defaultQuota: AiQuota = { used: 0, limit: 50 };

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspace: null,
  workspaceId: "default",
  loading: true,
  aiQuota: defaultQuota,
});

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  // Workspace ID mặc định = user UID (mỗi user có 1 workspace riêng)
  const workspaceId = user?.uid || "default";

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    // Realtime listener cho workspace document
    const unsubscribe = onSnapshot(
      doc(db, "workspaces", workspaceId),
      (snapshot) => {
        if (snapshot.exists()) {
          setWorkspace({ id: snapshot.id, ...snapshot.data() } as Workspace);
        }
        setLoading(false);
      },
      (error) => {
        console.error("[DEBUG][WorkspaceContext] Error fetching workspace:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, workspaceId]);

  const aiQuota = workspace?.aiQuota || defaultQuota;

  return (
    <WorkspaceContext.Provider value={{ workspace, workspaceId, loading, aiQuota }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
