import React from 'react';
import { BrandkitProvider } from '@/context/BrandkitContext';
import { SocialContentProvider } from '@/context/SocialContentContext';
import { WebsiteContentProvider } from '@/context/WebsiteContentContext';
import { PRContentProvider } from '@/context/PRContentContext';
import { BookingCampaignProvider } from '@/context/BookingCampaignContext';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const resolvedParams = await params;
  return (
    <BrandkitProvider projectId={resolvedParams.projectId}>
      <SocialContentProvider projectId={resolvedParams.projectId}>
        <WebsiteContentProvider projectId={resolvedParams.projectId}>
          <PRContentProvider projectId={resolvedParams.projectId}>
            <BookingCampaignProvider projectId={resolvedParams.projectId}>
              {children}
            </BookingCampaignProvider>
          </PRContentProvider>
        </WebsiteContentProvider>
      </SocialContentProvider>
    </BrandkitProvider>
  );
}
