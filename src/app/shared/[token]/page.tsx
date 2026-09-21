interface SharedVisitPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function SharedVisitPage({
  params,
}: SharedVisitPageProps) {
  const { token } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <h1 className="text-2xl font-semibold">Shared Visit: {token}</h1>
    </div>
  );
}

