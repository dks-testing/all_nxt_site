import Image from "next/image";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="grid flex-1 place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/logo/logo.png"
            alt="Sites Admin logo"
            width={240}
            height={100}
            priority
            className="mx-auto mb-5 h-20 w-auto max-w-full object-contain"
          />
          <h1 className="text-xl font-bold">Sign in to Sites Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Manage every shop website from one place.</p>
        </div>
        <LoginForm next={next ?? "/"} />
      </div>
    </main>
  );
}
