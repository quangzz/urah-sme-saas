import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ProjectProvider } from "@/context/ProjectContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { InfluencerProvider } from "@/context/InfluencerContext";

export const metadata: Metadata = {
  title: "URAH SME SaaS Platform",
  description: "Advanced AI Platform for SMEs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className="antialiased min-h-screen">
        <AuthProvider>
          <WorkspaceProvider>
            <InfluencerProvider>
              <ProjectProvider>
                {children}
              </ProjectProvider>
            </InfluencerProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
