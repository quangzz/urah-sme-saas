"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, Settings, LogOut, Trash2, Share2, Globe, Newspaper, Handshake } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/context/ProjectContext";

export function Sidebar({ workspaceId }: { workspaceId?: string }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { projects, deleteProject } = useProjects();

  const wid = workspaceId || "default";

  return (
    <aside className="peer w-64 h-screen border-r bg-card flex flex-col transition-all">
      <div className="h-14 flex items-center px-4 border-b">
        <Link href={`/workspace/${wid}`} className="font-bold text-lg tracking-tight truncate flex items-center gap-2 w-full justify-center lg:justify-start hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="URAH" className="h-[40px] w-auto object-contain" />
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-2">
          <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-tight text-muted-foreground">Workspace</h2>
          <nav className="space-y-1">
            <Link href={`/workspace/${wid}`} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors ${pathname === `/workspace/${wid}` ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}>
              <LayoutDashboard size={18} />
              Overview
            </Link>
          </nav>
        </div>
        
        <div className="px-3 mt-6 mb-2">
          <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-tight text-muted-foreground">Projects</h2>
          <nav className="space-y-1">
            {projects.map(proj => {
              const active = pathname.includes(`/workspace/${wid}/project/${proj.id}`);
              return (
                <div key={proj.id} className="group">
                  <Link href={`/workspace/${wid}/project/${proj.id}`} className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors ${active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}>
                    <div className="flex items-center gap-3 truncate">
                      <FolderKanban size={18} />
                      <span className="truncate">{proj.brandName || proj.id}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        deleteProject(proj.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </Link>
                  {active && (
                    <div className="ml-8 mt-1 space-y-1">
                      <Link href={`/workspace/${wid}/project/${proj.id}/brandkit`} className={`flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors ${pathname.includes('brandkit') ? 'text-primary' : 'text-muted-foreground'}`}>
                        <Settings size={15} /> Brandkit
                      </Link>
                      <Link href={`/workspace/${wid}/project/${proj.id}/social`} className={`flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors ${pathname.includes('/social') ? 'text-primary' : 'text-muted-foreground'}`}>
                        <Share2 size={15} /> Social Content
                      </Link>
                      <Link href={`/workspace/${wid}/project/${proj.id}/website`} className={`flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors ${pathname.includes('/website') ? 'text-primary' : 'text-muted-foreground'}`}>
                        <Globe size={15} /> Website Content
                      </Link>
                      <Link href={`/workspace/${wid}/project/${proj.id}/pr`} className={`flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors ${pathname.includes('/pr') && !pathname.includes('/project') ? 'text-primary' : 'text-muted-foreground'}`}>
                        <Newspaper size={15} /> PR Articles
                      </Link>
                      <Link href={`/workspace/${wid}/project/${proj.id}/booking`} className={`flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors ${pathname.includes('/booking') ? 'text-primary' : 'text-muted-foreground'}`}>
                        <Handshake size={15} /> KOL Booking
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>
      
      <div className="border-t p-4 flex flex-col gap-2">
         {user ? (
            <div className="flex items-center justify-between">
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium truncate">{user.displayName || 'User'}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
              <button onClick={logout} className="p-2 ml-1 text-muted-foreground hover:text-foreground rounded hover:bg-accent transition-colors" title="Logout">
                 <LogOut size={16} />
              </button>
            </div>
         ) : null}
      </div>
    </aside>
  );
}
