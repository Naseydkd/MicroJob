import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { getAdminUser, getAdminToken } from "../lib/adminAuth";
import { ChevronLeft, Plus, Trash2, Shield, ShieldCheck, Headphones, X } from "lucide-react";
import { toast } from "sonner";

const ROLES = [
  { value: "super_admin", label: "Super Admin", desc: "Accès total", icon: ShieldCheck, color: "text-red-600 bg-red-50" },
  { value: "moderator", label: "Modérateur", desc: "Gère utilisateurs et missions", icon: Shield, color: "text-blue-600 bg-blue-50" },
  { value: "support", label: "Support", desc: "Lecture + signalements", icon: Headphones, color: "text-green-600 bg-green-50" },
];

export function AdminManage() {
  const adminUser = getAdminUser();
  if (!adminUser) return <Navigate to="/admin-login" replace />;
  // Permettre l'accès si super_admin OU si adminRole n'est pas encore défini (ancien token)
  if (adminUser.adminRole && adminUser.adminRole !== "super_admin") return <Navigate to="/admin" replace />;

  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", nom: "", password: "", role: "moderator" });
  const [submitting, setSubmitting] = useState(false);

  const token = getAdminToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => { loadAdmins(); }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch("/admin/admins", { headers });
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/admin/admins", {
        method: "POST", headers,
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Admin créé avec succès");
      setShowForm(false);
      setForm({ email: "", nom: "", password: "", role: "moderator" });
      loadAdmins();
    } catch { toast.error("Erreur réseau"); }
    finally { setSubmitting(false); }
  };

  const handleChangeRole = async (adminId: string, role: string) => {
    try {
      const res = await fetch(`/admin/admins/${adminId}/role`, {
        method: "PATCH", headers,
        body: JSON.stringify({ role }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
      toast.success("Rôle mis à jour");
      loadAdmins();
    } catch { toast.error("Erreur"); }
  };

  const handleDelete = async (adminId: string, email: string) => {
    if (!window.confirm(`Supprimer l'admin ${email} ?`)) return;
    try {
      await fetch(`/admin/admins/${adminId}`, { method: "DELETE", headers });
      toast.success("Admin supprimé");
      loadAdmins();
    } catch { toast.error("Erreur"); }
  };

  const getRoleMeta = (role: string) => ROLES.find(r => r.value === role) || ROLES[1];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="size-5" />
          </Link>
          <h1 className="font-semibold text-gray-900">Gestion des administrateurs</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="size-4" />
          Nouvel admin
        </button>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Rôles expliqués */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLES.map(role => {
            const Icon = role.icon;
            return (
              <div key={role.value} className="bg-white rounded-xl border p-4">
                <div className={`size-10 rounded-lg ${role.color} flex items-center justify-center mb-3`}>
                  <Icon className="size-5" />
                </div>
                <p className="font-semibold text-sm">{role.label}</p>
                <p className="text-xs text-gray-500 mt-1">{role.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Liste des admins */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">Administrateurs ({admins.length})</h2>
          </div>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Chargement...</p>
          ) : (
            <div className="divide-y">
              {admins.map(admin => {
                const meta = getRoleMeta(admin.admin_role);
                const Icon = meta.icon;
                const isSelf = admin.id === adminUser.id;
                return (
                  <div key={admin.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-full ${meta.color} flex items-center justify-center`}>
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{admin.nom}</p>
                        <p className="text-xs text-gray-500">{admin.email}</p>
                        {isSelf && <span className="text-xs text-indigo-600 font-medium">Vous</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!isSelf ? (
                        <select
                          value={admin.admin_role}
                          onChange={e => handleChangeRole(admin.id, e.target.value)}
                          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${meta.color}`}>{meta.label}</span>
                      )}
                      {!isSelf && (
                        <button
                          onClick={() => handleDelete(admin.id, admin.email)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal création admin */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">Nouvel administrateur</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nom</label>
                <input
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Nom de l'admin"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@exemple.com"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Rôle</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                  {submitting ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
