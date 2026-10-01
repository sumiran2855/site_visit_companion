import { Metadata } from "next";
import { SharedVisitView } from "@/components/visits/SharedVisitView";

interface SharedVisitPageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({
  params,
}: SharedVisitPageProps): Promise<Metadata> {
  const { token } = await params;
  return {
    title: `Shared Site Visit — EC POWER`,
    description: `Read-only technical site inspection report (${token}).`,
    other: {
      "apple-itunes-app": `app-id=com.sumiran.b.sitevisitcompanionmobile, app-argument=sitevisitcompanionmobile://shared/${token}`,
    },
  };
}

export default async function SharedVisitPage({
  params,
}: SharedVisitPageProps) {
  const { token } = await params;
  return <SharedVisitView tokenOrId={token} />;
}