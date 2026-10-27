"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Settings, BarChart, FileText } from "lucide-react";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
        <span>Workspace</span>
        <span>/</span>
        <span className="font-mono">{workspaceId}</span>
        <span>/</span>
        <span className="text-foreground font-medium">Project</span>
      </div>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Project Details</h1>
          <p className="text-muted-foreground">Viewing data for project <span className="font-mono text-primary bg-primary/10 px-1 rounded">{projectId}</span>.</p>
        </div>
        <div className="space-x-3">
          <Button variant="outline" onClick={() => router.push(`/workspace/${workspaceId}/project/${projectId}/brandkit`)}>
            <Settings className="mr-2 w-4 h-4" /> Brandkit
          </Button>
          <Button>Edit Project</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 border rounded-xl bg-card">
          <div className="flex items-center mb-4 text-muted-foreground">
            <BarChart className="mr-2" size={20} />
            <h3 className="font-medium text-foreground">Analytics</h3>
          </div>
          <div className="h-40 w-full flex items-center justify-center border border-dashed rounded-lg text-muted-foreground text-sm">
            [Chart Area Placeholder]
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-card">
          <div className="flex items-center mb-4 text-muted-foreground">
             <FileText className="mr-2" size={20} />
             <h3 className="font-medium text-foreground">Content</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer text-sm">Landing Page Copy</div>
            <div className="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer text-sm">Email Campaign A</div>
          </div>
        </div>
      </div>
    </div>
  );
}
