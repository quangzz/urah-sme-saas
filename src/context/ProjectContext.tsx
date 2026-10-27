"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import type { Project } from "@/types/schema";
import { firestorePaths } from "@/types/schema";

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  deleteProject: (id: string) => Promise<void>;
  addProject: (projectData: Partial<Project & { brandkit?: any }>) => Promise<string>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

// ── Demo Mode helpers (localStorage) ─────────────────────────────────────────
const DEMO_STORAGE_KEY = "urah_demo_projects";

function getDemoProjects(workspaceId: string): Project[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    const all: Project[] = raw ? JSON.parse(raw) : [];
    return all.filter((p) => p.workspaceId === workspaceId);
  } catch {
    return [];
  }
}

function saveDemoProject(project: Project): void {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    const all: Project[] = raw ? JSON.parse(raw) : [];
    all.push(project);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error("[DEBUG][ProjectContext] Error saving demo project:", e);
  }
}

function deleteDemoProject(id: string): void {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    const all: Project[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(all.filter((p) => p.id !== id)));
  } catch (e) {
    console.error("[DEBUG][ProjectContext] Error deleting demo project:", e);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Demo Mode: load from localStorage
    if (!db) {
      setProjects(getDemoProjects(workspaceId));
      setLoading(false);
      return;
    }

    // Real Mode: Firestore subcollection — workspaces/{wId}/projects
    const projectsRef = collection(db, firestorePaths.projects(workspaceId));

    const unsubscribe = onSnapshot(projectsRef, (snapshot) => {
      const projs: Project[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        workspaceId,
        ...docSnap.data(),
      } as Project));
      setProjects(projs);
      setLoading(false);
    }, (error) => {
      console.error("[DEBUG][ProjectContext] Error fetching projects:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, workspaceId]);

  const deleteProject = useCallback(async (id: string) => {
    if (!db) {
      deleteDemoProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      return;
    }
    try {
      // Subcollection path: workspaces/{wId}/projects/{pId}
      await deleteDoc(doc(db, firestorePaths.project(workspaceId, id)));
    } catch (e) {
      console.error("[DEBUG][ProjectContext] Error deleting project:", e);
    }
  }, [workspaceId]);

  const addProject = useCallback(async (projectData: Partial<Project & { brandkit?: any }>) => {
    const { brandkit, ...restData } = projectData;

    if (!db) {
      // Demo Mode
      const fakeId = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newProject: Project = {
        id: fakeId,
        workspaceId,
        brandName: restData.brandName || "",
        slogan: restData.slogan || "",
        industry: restData.industry || "",
        targetAudience: restData.targetAudience || "",
        createdBy: user?.uid || "demo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveDemoProject(newProject);
      setProjects((prev) => [...prev, newProject]);
      return fakeId;
    }

    // Real Mode: Firestore subcollection
    const docData = {
      ...restData,
      workspaceId,
      createdBy: user?.uid || "unknown",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, firestorePaths.projects(workspaceId)), docData);
    
    // Save brandkit to subcollection if exists
    if (brandkit) {
      const brandkitData = {
        ...brandkit,
        isPrimary: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, firestorePaths.brandkits(workspaceId, docRef.id)), brandkitData);
    }

    return docRef.id;
  }, [user, workspaceId]);

  const updateProject = useCallback(async (id: string, data: Partial<Project>) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, firestorePaths.project(workspaceId, id)), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("[DEBUG][ProjectContext] Error updating project:", e);
    }
  }, [workspaceId]);

  return (
    <ProjectContext.Provider value={{ projects, loading, deleteProject, addProject, updateProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
};
