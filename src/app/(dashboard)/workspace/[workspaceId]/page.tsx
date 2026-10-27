"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Plus, Users, Activity, Sparkles } from "lucide-react";
import { useProjects } from "@/context/ProjectContext";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { projects, loading } = useProjects();
  const { workspace, aiQuota } = useWorkspace();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Workspace Overview</h1>
          <p className="text-muted-foreground">Manage your projects and team members in workspace <span className="font-mono text-primary bg-primary/10 px-1 rounded">{workspaceId}</span>.</p>
        </div>
        <Button onClick={() => router.push("/onboarding")}><Plus className="mr-2 h-4 w-4"/> New Project</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center gap-4 mb-4 text-primary">
            <div className="p-3 bg-primary/10 rounded-lg"><Activity size={24} /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
              <h3 className="text-2xl font-bold">{projects.length}</h3>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center gap-4 mb-4 text-secondary">
            <div className="p-3 bg-secondary/10 rounded-lg"><Users size={24} /></div>
            <div>
               <p className="text-sm font-medium text-muted-foreground">Team Members</p>
               <h3 className="text-2xl font-bold">{workspace?.memberIds?.length || 1}</h3>
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center gap-4 mb-4 text-accent">
            <div className="p-3 bg-accent/10 rounded-lg"><Sparkles size={24} /></div>
            <div>
               <p className="text-sm font-medium text-muted-foreground">AI Quota</p>
               <h3 className="text-2xl font-bold">{aiQuota.used} / {aiQuota.limit}</h3>
            </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-xl font-semibold mt-8 mb-4 tracking-tight">Recent Projects</h2>
      <div className="border rounded-xl bg-card overflow-hidden">
        {projects.length > 0 ? (
          projects.map((proj) => (
            <div key={proj.id} className="p-4 hover:bg-accent cursor-pointer transition-colors border-b last:border-0" onClick={() => router.push(`/workspace/${workspaceId}/project/${proj.id}`)}>
              <h4 className="font-medium text-sm">{proj.brandName || proj.id}</h4>
              {proj.industry && <span className="text-xs text-muted-foreground ml-2 bg-secondary/50 px-2 py-0.5 rounded">{proj.industry}</span>}
              <p className="text-xs text-muted-foreground mt-1">Updated recently by you</p>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No projects found. Create a new one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
