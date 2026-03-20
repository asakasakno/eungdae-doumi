import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="container">
      <AuthForm mode="login" />
    </main>
  );
}
