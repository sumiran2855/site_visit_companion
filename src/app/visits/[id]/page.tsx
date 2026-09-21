import React from "react";
import { ChecklistClient } from "./ChecklistClient";

interface VisitDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VisitDetailsPage({
  params,
}: VisitDetailsPageProps) {
  const { id } = await params;

  return <ChecklistClient visitId={id} />;
}
