import { Metadata } from "next";
import { SharedVisitView } from "@/components/visits/SharedVisitView";

interface VisitPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: VisitPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Site Visit Inspection — EC POWER`,
    description: `Site visit inspection report (${id}).`,
    other: {
      "apple-itunes-app": `app-id=com.sumiran.b.sitevisitcompanionmobile, app-argument=sitevisitcompanionmobile://visit/${id}`,
    },
  };
}

export default async function VisitPage({ params }: VisitPageProps) {
  const { id } = await params;
  return <SharedVisitView tokenOrId={id} />;
}