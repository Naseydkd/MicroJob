import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { getAdminUser, getAdminToken } from "../lib/adminAuth";
import { ChevronLeft, User, Building2, CheckCircle, Ban, Briefcase, Star } from "lucide-react";
import { toast } from "sonner";

export function AdminUserDetail() {
  const adminUser = getAdminUser();
  if (!adminUser) return <Navigate to="/admin-login" replace />;

  const { userId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token = getAdminToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetch(`/admin/users/${userId}`, { headers })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleBan = async () => {
    const banned = !data.user.banned;
    const reason = banned ? window.prompt("Raison du bannissement :") : "";
    if (banned && !reason) return;
    await fetch(`/admin/users/${userId}/ban`, {
      method: "PATCH", headers,
      body: JSON.stringify({ banned, reason }),
    });
    toast.success(banned ? "Utilisateur banni" : "Utilisateur débanni");
    setData((prev: any) => ({ ...prev, user: { ...prev.user, banned, ban_reason: reason } }));
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Chargement...</div>;
  if (!data) return <div className="p-8 text-red-500">Utilisateur introuvable</div>;

  const { user, candidatures, missions } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 h-16 flex items-center gap-4 sticky top-0 z-30">
        <Link to="/admin-users" className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="font-semibold text-gray-900">Détail utilisateur</h1>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Profil */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`size-16 rounded-full flex items-center justify-center ${user.user_type === "jeune" ? "bg-indigo-100" : "bg-green-100"}`}>
                {user.user_type === "jeune" ? <User className="size-8 text-indigo-600" /> : <Building2 className="size-8 text-green-600" />}
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.nom} {user.prenom || ""}</h2>
                <p className="text-gray-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.user_type === "jeune" ? "bg-indigo-100 text-indigo-700" : "bg-green-100 text-green-700"}`}>
                    {user.user_type === "jeune" ? "Jeune" : "Entreprise"}
                  </span>
                  {user.identity_verified ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="size-3" /> Vérifié</span> : <span className="text-xs text-gray-400">Non vérifié</span>}
                  {user.banned && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">Banni</span>}
                </div>
              </div>
            </div>
            <button onClick={handleBan} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${user.banned ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
              <Ban className="size-4" />
              {user.banned ? "Débannir" : "Bannir"}
            </button>
          </div>
          {user.banned && user.ban_reason && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
              Raison du bannissement : {user.ban_reason}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t text-sm">
            <div><p className="text-gray-500">Téléphone</p><p className="font-medium">{user.telephone || "—"}</p></div>
            <div><p className="text-gray-500">Ville</p><p className="font-medium">{user.ville || "—"}</p></div>
            <div><p className="text-gray-500">Inscrit le</p><p className="font-medium">{new Date(user.created_at).toLocaleDateString("fr-FR")}</p></div>
          </div>
        </div>

        {/* Candidatures (jeune) */}
        {user.user_type === "jeune" && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Briefcase className="size-4" /> Candidatures ({candidatures.length})</h3>
            {candidatures.length === 0 ? <p className="text-gray-500 text-sm">Aucune candidature</p> : (
              <div className="space-y-2">
                {candidatures.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <span className="font-medium">{c.mission_titre || c.mission_id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${c.statut === "acceptée" ? "bg-green-100 text-green-700" : c.statut === "refusée" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{c.statut}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Missions (entreprise) */}
        {user.user_type === "entreprise" && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Briefcase className="size-4" /> Missions publiées ({missions.length})</h3>
            {missions.length === 0 ? <p className="text-gray-500 text-sm">Aucune mission</p> : (
              <div className="space-y-2">
                {missions.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <span className="font-medium">{m.titre}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${m.statut === "ouverte" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{m.statut}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
