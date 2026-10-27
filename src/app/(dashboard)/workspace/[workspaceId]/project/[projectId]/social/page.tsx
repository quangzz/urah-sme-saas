"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocialContent } from "@/context/SocialContentContext";
import { Button } from "@/components/ui/Button";
import { Plus, MoreVertical, Edit2, Share2, Info } from "lucide-react";

export default function SocialContentPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  
  const { socialContents, loading, updatePostStatus } = useSocialContent();
  const [boardType, setBoardType] = useState<"kanban" | "list">("kanban");

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading social content...</div>;
  }

  const drafts = socialContents.filter(p => p.status === "draft");
  const approved = socialContents.filter(p => p.status === "approved");
  const published = socialContents.filter(p => p.status === "published");

  const PostCard = ({ post }: { post: any }) => (
    <div className="bg-card p-4 rounded-xl border hover:shadow-md transition-all group flex flex-col h-full relative cursor-pointer" onClick={() => router.push(`/workspace/${workspaceId}/project/${projectId}/social/${post.id}`)}>
      <div className="flex justify-between items-start mb-2">
         <span className="text-xs font-medium uppercase tracking-wider px-2 py-1 bg-accent rounded text-accent-foreground">{post.platform}</span>
         <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
           <MoreVertical size={16} />
         </button>
      </div>
      {(post.imageUrl || post.imageBase64) ? (
        <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted mb-3 flex-shrink-0">
          <img src={post.imageUrl || post.imageBase64} alt="Post asset" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full aspect-video rounded-lg border-2 border-dashed border-border mb-3 flex items-center justify-center text-muted-foreground flex-shrink-0">
          No Image
        </div>
      )}
      <p className="text-sm line-clamp-3 mb-4 flex-1">{post.caption || "No caption provided yet..."}</p>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t">
         <span>{post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}</span>
         <div className="flex gap-2">
            {post.status === "draft" && (
              <button 
                onClick={(e) => { e.stopPropagation(); updatePostStatus(post.id, "approved"); }} 
                className="text-primary hover:underline font-medium"
              >
                Approve
              </button>
            )}
            {post.status === "approved" && (
              <button 
                onClick={(e) => { e.stopPropagation(); updatePostStatus(post.id, "published"); }} 
                className="text-green-500 hover:underline font-medium"
              >
                Publish
              </button>
            )}
         </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Social Content</h1>
          <p className="text-muted-foreground">Manage and auto-generate social media posts for your campaigns.</p>
        </div>
        <Button onClick={() => router.push(`/workspace/${workspaceId}/project/${projectId}/social/new`)}>
          <Plus className="mr-2 h-4 w-4" /> New Post
        </Button>
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)] overflow-x-auto pb-4">
        {/* DRAFT COLUMN */}
        <div className="flex-1 min-w-[320px] max-w-[400px] flex flex-col bg-muted/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4 px-2">
             <h3 className="font-semibold flex items-center"><Edit2 className="w-4 h-4 mr-2" /> Drafts <span className="ml-2 bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">{drafts.length}</span></h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
             {drafts.length === 0 ? (
               <div className="text-center p-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl">No draft posts</div>
             ) : (
               drafts.map(p => <PostCard key={p.id} post={p} />)
             )}
          </div>
        </div>

        {/* APPROVED COLUMN */}
        <div className="flex-1 min-w-[320px] max-w-[400px] flex flex-col bg-muted/30 rounded-2xl p-4">
           <div className="flex items-center justify-between mb-4 px-2">
             <h3 className="font-semibold flex items-center text-primary"><Info className="w-4 h-4 mr-2" /> Approved <span className="ml-2 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">{approved.length}</span></h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
             {approved.length === 0 ? (
               <div className="text-center p-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl">No approved posts</div>
             ) : (
               approved.map(p => <PostCard key={p.id} post={p} />)
             )}
          </div>
        </div>

        {/* PUBLISHED COLUMN */}
        <div className="flex-1 min-w-[320px] max-w-[400px] flex flex-col bg-muted/30 rounded-2xl p-4">
           <div className="flex items-center justify-between mb-4 px-2">
             <h3 className="font-semibold flex items-center text-green-600"><Share2 className="w-4 h-4 mr-2" /> Published <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{published.length}</span></h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
             {published.length === 0 ? (
               <div className="text-center p-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl">No published posts</div>
             ) : (
               published.map(p => <PostCard key={p.id} post={p} />)
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
