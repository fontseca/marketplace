import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <SignIn appearance={{ variables: { colorPrimary: "#2563eb" } }} />
    </div>
  );
}

