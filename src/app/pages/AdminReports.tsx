import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { getAdminUser, getAdminToken } from "../lib/adminAuth";
import { ChevronLeft, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export function AdminReports() {
  const adminUser = getAdminUser();
  if (!adminUser) return <Navigate to="/admin-login" replace />;

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = getAdminToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/admin/reports", { headers });
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  const handleResolve = async (reportId: string, status: string) => {
    await fetch(`/admin/reports/${reportId}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ status }),
    });
    toast.success("Signalement mis à jour");
    loadReports();
  };

  const statusColor: Record<string, string> = {
    pending: "bg-orange-100 text-orange-700",
    resolved: "bg-green-100 text-green-700",
    dismissed: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 h-16 flex items-center gap-4 sticky top-0 z-30">
        <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-semibold text-gray-900">Signalements</h1>
      </header>

      <div className="p-6 space-y-4">
        {loading ? (
          <p className="text-center text-gray-500 py-8">Chargement...</p>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <CheckCircle className="size-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500">Aucun signalement en attente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="bg-white rounded-xl border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-full bg-orange-100 flex items-center justify-center mt-0.5">
                      <AlertTriangle className="size-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.status] || "bg-gray-100 text-gray-700"}`}>{r.status}</span>
                        <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                      <p className="text-sm font-medium">Signalé par : {r.reporter_nom || r.reporter_email || "Anonyme"}</p>
                      <p className="text-sm text-gray-600 mt-1">{r.reason}</p>
                      <p className="text-xs text-gray-400 mt-1">Cible : {r.target_type} #{r.target_id}</p>
                    </div>
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleResolve(r.id, "resolved")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200"
                      >
                        <CheckCircle className="size-3.5" /> Résoudre
                      </button>
                      <button
                        onClick={() => handleResolve(r.id, "dismissed")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200"
                      >
                        <XCircle className="size-3.5" /> Ignorer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
