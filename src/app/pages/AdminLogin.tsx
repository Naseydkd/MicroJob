import { useState } from "react";
import { useNavigate } from "react-router";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const ADMIN_AUTH_KEY = "microjob_admin_user";

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, userType: "admin" }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Identifiants incorrects");
        return;
      }

      if (data.userType !== "admin") {
        toast.error("Accès réservé aux administrateurs");
        return;
      }

      localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify({ id: data.userId, email: data.email, nom: data.nom, adminRole: data.adminRole }));
      localStorage.setItem("admin_token", data.accessToken);
      navigate("/admin");    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="size-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Microjob Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Accès réservé aux administrateurs</p>
        </div>

        <form onSubmit={handleLogin} className="bg-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@microjob.com"
                className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm border border-gray-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm border border-gray-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
