import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { getAdminUser, clearAdminAuth, getAdminToken, refreshAdminToken } from "../lib/adminAuth";
import { api } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Users,
  Briefcase,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  ClipboardList,
  Building2,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  Ban,
  TrendingUp,
} from "lucide-react";

export function AdminDashboard() {
  const navigate = useNavigate();
  const adminUser = getAdminUser();
  if (!adminUser) return <Navigate to="/admin-login" replace />;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJeunes: 0,
    totalEntreprises: 0,
    totalMissions: 0,
    missionsOuvertes: 0,
    pendingVerifications: 0,
    totalCandidatures: 0,
    bannedUsers: 0,
  });
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    refreshAdminToken().finally(() => loadData());
  }, []);

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    const headers: Record<string, string> = { 
      Authorization: `Bearer ${token}`, 
      "Content-Type": "application/json" 
    };

    try {
      const [statsRes, verifsRes, usersRes] = await Promise.allSettled([
        fetch("/admin/stats", { headers }).then(r => r.json()),
        fetch("/admin/pending-verifications", { headers }).then(r => r.json()),
        fetch("/admin/users", { headers }).then(r => r.json()),
      ]);

      const statsData = statsRes.status === "fulfilled" ? statsRes.value : {};
      const verifData = verifsRes.status === "fulfilled" && Array.isArray(verifsRes.value) ? verifsRes.value : [];
      const usersData = usersRes.status === "fulfilled" && Array.isArray(usersRes.value) ? usersRes.value : [];

      setPendingVerifications(verifData);
      setRecentUsers(usersData.slice(0, 5));
      setStats({
        totalUsers: statsData.total_users ?? 0,
        totalJeunes: statsData.total_jeunes ?? 0,
        totalEntreprises: statsData.total_entreprises ?? 0,
        totalMissions: statsData.total_missions ?? 0,
        missionsOuvertes: statsData.missions_ouvertes ?? 0,
        pendingVerifications: statsData.pending_verifs ?? 0,
        totalCandidatures: statsData.total_candidatures ?? 0,
        bannedUsers: statsData.banned_users ?? 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: string, approved: boolean) => {
    setProcessing(userId);
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`/admin/verify-identity/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      if (!res.ok) throw new Error("Erreur");
      await loadData();
    } catch (error: any) {
      alert(error.message || "Erreur");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-200 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex md:flex-col`}>
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 italic">Microjob</p>
              <h2 className="font-bold text-lg">Admin Panel</h2>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="md:hidden p-1 hover:bg-gray-700 rounded">
              <X className="size-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-700 text-white">
              <LayoutDashboard className="size-5" />
              <span className="text-sm font-medium">Tableau de bord</span>
            </div>
          </Link>
          <Link to="/admin-verifications" onClick={() => setIsMenuOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
              <ShieldCheck className="size-5" />
              <span className="text-sm">Vérifications</span>
              {stats.pendingVerifications > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{stats.pendingVerifications}</span>
              )}
            </div>
          </Link>
          <Link to="/admin-users" onClick={() => setIsMenuOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
              <Users className="size-5" />
              <span className="text-sm">Utilisateurs</span>
            </div>
          </Link>
          <Link to="/admin-missions" onClick={() => setIsMenuOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
              <Briefcase className="size-5" />
              <span className="text-sm">Missions</span>
            </div>
          </Link>
          <Link to="/admin-reports" onClick={() => setIsMenuOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
              <AlertCircle className="size-5" />
              <span className="text-sm">Signalements</span>
            </div>
          </Link>
          <Link to="/admin-logs" onClick={() => setIsMenuOpen(false)}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
              <Activity className="size-5" />
              <span className="text-sm">Logs</span>
            </div>
          </Link>
          {adminUser.adminRole === "super_admin" && (
            <Link to="/admin-manage" onClick={() => setIsMenuOpen(false)}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
                <ShieldCheck className="size-5" />
                <span className="text-sm">Administrateurs</span>
              </div>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-8 rounded-full bg-gray-600 flex items-center justify-center">
              <User className="size-4 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-medium">{adminUser.nom || "Admin"}</p>
              <p className="text-xs text-gray-400">{adminUser.email}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600 text-white mt-1 inline-block">
                {adminUser.adminRole === "super_admin" ? "Super Admin" : adminUser.adminRole === "moderator" ? "Modérateur" : "Support"}
              </span>
            </div>
          </div>
          <Link to="/admin-login" onClick={clearAdminAuth}>
            <Button variant="ghost" size="sm" className="w-full text-gray-400 hover:text-white hover:bg-gray-700">
              <LogOut className="size-4 mr-2" />
              Déconnexion
            </Button>
          </Link>
        </div>
      </aside>

      {/* Overlay mobile */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b px-6 h-16 flex items-center gap-4 sticky top-0 z-30">
          <button onClick={() => setIsMenuOpen(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="size-5" />
          </button>
          <h1 className="font-semibold text-gray-900">Tableau de bord</h1>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Utilisateurs", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Jeunes", value: stats.totalJeunes, icon: User, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Entreprises", value: stats.totalEntreprises, icon: Building2, color: "text-green-600", bg: "bg-green-50" },
              { label: "Missions", value: stats.totalMissions, icon: Briefcase, color: "text-orange-600", bg: "bg-orange-50" },
              { label: "Ouvertes", value: stats.missionsOuvertes, icon: CheckCircle2, color: "text-teal-600", bg: "bg-teal-50" },
              { label: "En attente", value: stats.pendingVerifications, icon: Clock, color: "text-red-600", bg: "bg-red-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label}>
                <CardContent className="pt-5 pb-4">
                  <div className={`size-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                    <Icon className={`size-5 ${color}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{loading ? "—" : value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Vérifications en attente */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Vérifications en attente</CardTitle>
                {stats.pendingVerifications > 0 && (
                  <Badge className="bg-red-100 text-red-700">{stats.pendingVerifications}</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-500 text-center py-4">Chargement...</p>
                ) : pendingVerifications.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle2 className="size-10 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aucune vérification en attente</p>
                  </div>
                ) : (
                  pendingVerifications.slice(0, 4).map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{v.nom} {v.prenom}</p>
                        <p className="text-xs text-gray-500">{v.email}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {v.user_type === "jeune" ? "Jeune" : "Entreprise"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8"
                          disabled={processing === v.id}
                          onClick={() => handleVerify(v.id, true)}>
                          ✓
                        </Button>
                        <Button size="sm" variant="destructive" className="h-8"
                          disabled={processing === v.id}
                          onClick={() => handleVerify(v.id, false)}>
                          ✗
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                {pendingVerifications.length > 4 && (
                  <Link to="/admin-verifications">
                    <Button variant="ghost" size="sm" className="w-full">Voir tout ({pendingVerifications.length})</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Utilisateurs récents */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Utilisateurs récents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-500 text-center py-4">Chargement...</p>
                ) : recentUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Aucun utilisateur</p>
                ) : (
                  recentUsers.map((u) => (
                    <div key={u.userId || u.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className={`size-9 rounded-full flex items-center justify-center ${u.userType === "jeune" ? "bg-indigo-100" : "bg-green-100"}`}>
                        {u.userType === "jeune"
                          ? <User className="size-4 text-indigo-600" />
                          : <Building2 className="size-4 text-green-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{u.nom} {u.prenom || ""}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {u.userType === "jeune" ? "Jeune" : "Entreprise"}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
