import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-6 sm:p-12 md:p-20 bg-background text-foreground">
      <main className="w-full max-w-2xl my-auto space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            EC POWER
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Site Visit Companion &mdash; User Agreement
          </p>
        </div>

        <div className="prose dark:prose-invert text-sm text-muted-foreground space-y-4 leading-relaxed">
          <p>
            Access to the Site Visit Companion is restricted to authenticated and approved personnel. Account registrations require administrator authorization.
          </p>
          <p>
            By using this application, technicians and administrators agree to input accurate technical installation data and safeguard project confidential materials.
          </p>
        </div>

        <div className="pt-4">
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center text-sm font-medium text-foreground hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </main>

      <footer className="w-full max-w-2xl pt-12 flex items-center gap-6 text-xs text-muted-foreground">
        <Link href={ROUTES.PRIVACY} className="hover:text-foreground transition-colors">
          Privacy
        </Link>
        <span>&copy; EC POWER</span>
      </footer>
    </div>
  );
}

