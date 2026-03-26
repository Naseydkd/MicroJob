import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { getAdminUser, getAdminToken } from "../lib/adminAuth";
import { Search, Trash2, PauseCircle, PlayCircle, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export function AdminMissions() {
  const adminUser = getAdminUser();
  if (!adminUser) return <Navigate to="/admin-login" replace />;

  const [missions, setMissions] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const token = getAdminToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => { loadMissions(); }, []);

  useEffect(() => {
    let result = missions;
    if (statusFilter !== "all") result = result.filter(m => m.statut === statusFilter);
    if (search) result = result.filter(m =>
      `${m.titre} ${m.entreprise_nom}`.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [missions, search, statusFilter]);

  const loadMissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/missions", { headers });
      const data = await res.json();
      setMissions(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  const handleDelete = async (missionId: string, titre: string) => {
    if (!window.confirm(`Supprimer la mission "${titre}" ?`)) return;
    const reason = window.prompt("Raison de la suppression :") || "";
    await fetch(`/admin/missions/${missionId}`, {
      method: "DELETE", headers,
      body: JSON.stringify({ reason }),
    });
    toast.success("Mission supprimée");
    loadMissions();
  };

  const handleSuspend = async (missionId: string, suspended: boolean) => {
    await fetch(`/admin/missions/${missionId}/suspend`, {
      method: "PATCH", headers,
      body: JSON.stringify({ suspended }),
    });
    toast.success(suspended ? "Mission suspendue" : "Mission réactivée");
    loadMissions();
  };

  const statusColor: Record<string, string> = {
    ouverte: "bg-green-100 text-green-700",
    terminée: "bg-blue-100 text-blue-700",
    suspendue: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 h-16 flex items-center gap-4 sticky top-0 z-30">
        <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-semibold text-gray-900">Missions</h1>
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
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="ouverte">Ouvertes</option>
            <option value="terminée">Terminées</option>
            <option value="suspendue">Suspendues</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Mission</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Entreprise</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Rémunération</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Statut</th>
                <th className="text-right px-4 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Aucune mission</td></tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.titre}</p>
                    <p className="text-gray-500 text-xs">{m.lieu} • {m.duree}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{m.entrepriseNom || m.entreprise_nom || "—"}</td>
                  <td className="px-4 py-3 font-medium text-green-700 hidden md:table-cell">{Number(m.remuneration).toLocaleString()} F</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[m.statut] || "bg-gray-100 text-gray-700"}`}>{m.statut}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSuspend(m.id, m.statut !== "suspendue")}
                        className="p-1.5 hover:bg-orange-100 rounded-lg"
                        title={m.statut === "suspendue" ? "Réactiver" : "Suspendre"}
                      >
                        {m.statut === "suspendue"
                          ? <PlayCircle className="size-4 text-green-600" />
                          : <PauseCircle className="size-4 text-orange-600" />}
                      </button>
                      <button
                        onClick={() => handleDelete(m.id, m.titre)}
                        className="p-1.5 hover:bg-red-100 rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 className="size-4 text-red-600" />
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
