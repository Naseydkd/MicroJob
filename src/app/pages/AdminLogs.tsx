import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { getAdminUser, getAdminToken } from "../lib/adminAuth";
import { ChevronLeft, Activity } from "lucide-react";

const actionLabels: Record<string, { label: string; color: string }> = {
  ban_user: { label: "Bannissement", color: "bg-red-100 text-red-700" },
  unban_user: { label: "Débannissement", color: "bg-green-100 text-green-700" },
  delete_mission: { label: "Suppression mission", color: "bg-red-100 text-red-700" },
  suspend_mission: { label: "Suspension mission", color: "bg-orange-100 text-orange-700" },
  reactivate_mission: { label: "Réactivation mission", color: "bg-green-100 text-green-700" },
  ban_user_identity: { label: "Vérification identité", color: "bg-blue-100 text-blue-700" },
};

export function AdminLogs() {
  const adminUser = getAdminUser();
  if (!adminUser) return <Navigate to="/admin-login" replace />;

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = getAdminToken();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch("/admin/logs", { headers })
      .then(r => r.json())
      .then(data => setLogs(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 h-16 flex items-center gap-4 sticky top-0 z-30">
        <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-semibold text-gray-900">Logs d'activité</h1>
      </header>

      <div className="p-6">
        {loading ? (
          <p className="text-center text-gray-500 py-8">Chargement...</p>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Activity className="size-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun log d'activité</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Action</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Admin</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Cible</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Détails</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map(log => {
                  const meta = actionLabels[log.action] || { label: log.action, color: "bg-gray-100 text-gray-700" };
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>{meta.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{log.email || log.admin_id}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell font-mono">{log.target_id}</td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{log.details || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(log.created_at).toLocaleString("fr-FR")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
