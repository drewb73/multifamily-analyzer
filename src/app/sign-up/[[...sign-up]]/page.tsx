import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            PropertyAnalyzer
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Start your 3-day free trial today
          </p>
        </div>

        {/* Clerk Sign Up Component */}
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-slate-900 hover:bg-slate-800 text-sm normal-case",
              card: "shadow-xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
            },
          }}
        />

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          No credit card required • Cancel anytime
        </div>
      </div>
    </div>
  );
}