import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            PropertyAnalyzer
          </h1>
          <p className="text-slate-600">
            Start your 72-hour free trial today
          </p>
        </div>

        {/* Clerk Sign Up Component */}
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-slate-900 hover:bg-slate-800 text-white text-sm normal-case font-medium",
              card: "shadow-2xl border-0",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              footer: "hidden", // Remove "Secured by Clerk"
              formFieldInput: "border-slate-300 focus:border-slate-900",
              formFieldLabel: "text-slate-700 font-medium",
              socialButtonsBlockButton: "border-slate-300 hover:bg-slate-50",
              dividerLine: "bg-slate-200",
              dividerText: "text-slate-500",
              footerActionLink: "text-slate-900 hover:text-slate-700 font-medium",
            },
          }}
        />

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-600">
          No credit card required • Cancel anytime
        </div>
      </div>
    </div>
  );
}