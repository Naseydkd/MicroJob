import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { getAdminUser, getAdminToken } from "../lib/adminAuth";
import { Search, User, Building2, Ban, CheckCircle, Eye, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export function AdminUsers() {
  const adminUser = getAdminUser();
  if (!adminUser) return <Navigate to="/admin-login" replace />;

  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const token = getAdminToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    let result = users;
    if (typeFilter !== "all") result = result.filter(u => u.user_type === typeFilter);
    if (search) result = result.filter(u =>
      `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [users, search, typeFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/admin/users", { headers });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  const handleBan = async (userId: string, banned: boolean) => {
    const reason = banned ? window.prompt("Raison du bannissement :") : "";
    if (banned && !reason) return;
    try {
      await fetch(`/admin/users/${userId}/ban`, {
        method: "PATCH", headers,
        body: JSON.stringify({ banned, reason }),
      });
      toast.success(banned ? "Utilisateur banni" : "Utilisateur débanni");
      loadUsers();
    } catch { toast.error("Erreur"); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 h-16 flex items-center gap-4 sticky top-0 z-30">
        <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-semibold text-gray-900">Utilisateurs</h1>
      </header>

      <div className="p-6 space-y-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="all">Tous</option>
            <option value="jeune">Jeunes</option>
            <option value="entreprise">Entreprises</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Utilisateur</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Vérifié</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Inscrit le</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Statut</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Aucun utilisateur</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 ${u.banned ? "bg-red-50" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`size-8 rounded-full flex items-center justify-center ${u.user_type === "jeune" ? "bg-indigo-100" : "bg-green-100"}`}>
                        {u.user_type === "jeune" ? <User className="size-4 text-indigo-600" /> : <Building2 className="size-4 text-green-600" />}
                      </div>
                      <div>
                        <p className="font-medium">{u.nom} {u.prenom || ""}</p>
                        <p className="text-gray-500 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.user_type === "jeune" ? "bg-indigo-100 text-indigo-700" : "bg-green-100 text-green-700"}`}>
                      {u.user_type === "jeune" ? "Jeune" : "Entreprise"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.identity_verified ? <CheckCircle className="size-4 text-green-500" /> : <span className="text-gray-400 text-xs">Non</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs">
                    {new Date(u.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    {u.banned ? <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">Banni</span>
                      : <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Actif</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin-users/${u.id}`}>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg" title="Voir détail">
                          <Eye className="size-4 text-gray-600" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleBan(u.id, !u.banned)}
                        className={`p-1.5 rounded-lg ${u.banned ? "hover:bg-green-100" : "hover:bg-red-100"}`}
                        title={u.banned ? "Débannir" : "Bannir"}
                      >
                        <Ban className={`size-4 ${u.banned ? "text-green-600" : "text-red-600"}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
