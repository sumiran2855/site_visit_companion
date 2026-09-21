interface VisitDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VisitDetailsPage({
  params,
}: VisitDetailsPageProps) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <h1 className="text-2xl font-semibold">Visit Details: {id}</h1>
    </div>
  );
}

