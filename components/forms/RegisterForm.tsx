"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, AtSign, Loader2 } from "lucide-react";

export default function RegisterForm() {
  const [form, setForm] = useState({ email: "", username: "", displayName: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); return; }
      router.push("/login?registered=true");
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: "displayName", label: "Display Name", type: "text", icon: User, placeholder: "John Doe" },
          { key: "username", label: "Username", type: "text", icon: AtSign, placeholder: "johndoe" },
          { key: "email", label: "Email", type: "email", icon: Mail, placeholder: "john@example.com" },
          { key: "password", label: "Password", type: "password", icon: Lock, placeholder: "Min 8 characters" },
        ].map(({ key, type, icon: Icon, placeholder }) => (
          <div key={key} className="relative">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type={type} value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder} required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-10 py-3 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-gray-500" />
          </div>
        ))}
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl text-sm font-semibold transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create Account
        </button>
      </form>
      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
      </p>
    </div>
  );
}
