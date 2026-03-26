import { Link, Navigate, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "../components/ui/carousel";
import { 
  Briefcase, 
  User,
  Bell,
  Plus,
  Star,
  CheckCircle2,
  Users,
  LogOut,
  Building2,
  Menu
} from "lucide-react";
import { Candidature, Mission } from "../types";
import { clearAuthUser, getAuthUser, saveAuthUser } from "../lib/auth";
import { toast } from "sonner";
import { useI18n } from "../lib/i18n";
import { api } from "../lib/api";
import { BottomNav } from "../components/BottomNav";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export function DashboardEntreprise() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const authUser = getAuthUser();
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.userType === "jeune") return <Navigate to="/dashboard-jeune" replace />;
  
  const [currentUser, setCurrentUser] = useState({
    id: authUser?.id ?? "",
    email: authUser?.email ?? "",
    nom: authUser?.nom ?? "",
  });
  const [mesMissions, setMesMissions] = useState<Mission[]>([]);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [profile, setProfile] = useState({
    nomEntreprise: "",
    secteurActivite: "",
    notesMoyenne: 0,
    nombreEvaluations: 0,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!carouselApi) return;
    const interval = setInterval(() => carouselApi.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [carouselApi]);

  useEffect(() => {
    if (!currentUser.id) return;
    api.get<any>(`/users/${currentUser.id}`)
      .then((data) => {
        setCurrentUser({
          id: data.userId,
          email: data.email,
          nom: data.nom ?? "",
        });
        const token = localStorage.getItem('access_token');
        if (token) {
          saveAuthUser({
            id: data.userId,
            email: data.email,
            userType: data.userType,
            nom: data.nom ?? null,
            prenom: data.prenom ?? null,
            telephone: data.telephone ?? null,
            ville: data.ville ?? null,
          }, token);
        }
      })
      .catch(() => undefined);
  }, [currentUser.id]);

  useEffect(() => {
    if (!currentUser.id) return;
    api.get<Mission[]>("/missions")
      .then((data) =>
        setMesMissions(Array.isArray(data) ? data.filter((m) => m.entrepriseId === currentUser.id) : [])
      )
      .catch(() => setMesMissions([]));
  }, [currentUser.id]);

  useEffect(() => {
    if (!currentUser.id) return;
    api.get<Candidature[]>(`/candidatures/entreprise/${currentUser.id}`)
      .then((data) => setCandidatures(Array.isArray(data) ? data : []))
      .catch(() => setCandidatures([]));
  }, [currentUser.id]);

  useEffect(() => {
    if (!currentUser.id) return;
    api.get<any>(`/entreprise-profiles/${currentUser.id}`)
      .then((data) =>
        setProfile({
          nomEntreprise: data?.nomEntreprise || currentUser.nom || "",
          secteurActivite: data?.secteurActivite || "",
          notesMoyenne: Number(data?.notesMoyenne || 0),
          nombreEvaluations: Number(data?.nombreEvaluations || 0),
        })
      )
      .catch(() =>
        setProfile({
          nomEntreprise: currentUser.nom || "",
          secteurActivite: "",
          notesMoyenne: 0,
          nombreEvaluations: 0,
        })
      );
  }, [currentUser.id, currentUser.nom]);

  const missionsActives = mesMissions.filter((m) => m.statut === "ouverte").length;
  const missionsTerminees = mesMissions.filter((m) => m.statut === "terminée").length;
  const candidaturesRecues = candidatures.filter((c) => c.statut === "en_attente").length;
  const entrepriseNomAffiche = profile.nomEntreprise || currentUser.nom || "";

  const handleCompleteMission = async (mission: Mission) => {
    const confirmed = window.confirm(`Marquer la mission "${mission.titre}" comme terminée ?`);
    if (!confirmed) return;

    try {
      const payload = await api.patch<Mission>(`/missions/${mission.id}`, { statut: "terminée" });
      setMesMissions((prev) => prev.map((m) => (m.id === mission.id ? payload : m)));
      toast.success(tr("Mission marquée comme terminée", "Goy nondi sanda timmante", "An yiwa aiki alamar an kammala"));
    } catch (error: any) {
      toast.error(error?.message || tr("Impossible de terminer la mission", "Goy timmayan mana", "Ba a iya kammala aikin ba"));
    }
  };

  const handleAcceptCandidate = async (candidatureId: string) => {
    try {
      await api.patch(`/applications/${candidatureId}`, { statut: "acceptée" });
      setCandidatures((prev) =>
        prev.map((c) => (c.id === candidatureId ? { ...c, statut: "acceptée" } : c))
      );
      toast.success(tr("Candidature acceptée", "Naafal taaba", "An amince da neman aiki"));
    } catch (error: any) {
      toast.error(error?.message || tr("Impossible d'accepter la candidature", "Naafal taabayan mana", "Ba a iya amincewa da neman aiki ba"));
    }
  };

  const handleRejectCandidate = async (candidatureId: string) => {
    const reason = window.prompt(tr("Motif du refus:", "Waneyan dalili:", "Dalilin kin amincewa:"));
    if (!reason?.trim()) return;

    try {
      await api.patch(`/applications/${candidatureId}`, { statut: "refusée", motifRefus: reason });
      setCandidatures((prev) =>
        prev.map((c) => (c.id === candidatureId ? { ...c, statut: "refusée", motifRefus: reason } : c))
      );
      toast.success(tr("Candidature refusée", "Naafal wanya", "An ki neman aiki"));
    } catch (error: any) {
      toast.error(error?.message || tr("Impossible de refuser la candidature", "Naafal wanayan mana", "Ba a iya kin neman aiki ba"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-gradient-to-br from-green-500 to-green-600 rounded-b-3xl pb-20">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <div className="flex flex-col gap-1">
                  <span className="w-6 h-0.5 bg-white rounded-full"></span>
                  <span className="w-6 h-0.5 bg-white rounded-full"></span>
                  <span className="w-6 h-0.5 bg-white rounded-full"></span>
                </div>
              </button>
              <div>
                <p className="text-white/80 text-xs font-light italic">Microjob</p>
                <p className="text-white text-sm font-medium">{tr("Bienvenue", "Barka", "Barka da zuwa")}</p>
                <p className="text-white text-base font-bold uppercase tracking-wide">{entrepriseNomAffiche}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/publier-mission">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Plus className="size-5 text-white" />
                </button>
              </Link>

              <button aria-label="Notifications" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="size-5 text-white" />
              </button>

              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Carousel qui chevauche le header */}
      <div className="container mx-auto px-4 -mt-16 relative z-50 mb-8">
        <Carousel className="w-full" setApi={setCarouselApi} opts={{ loop: true }}>
          <CarouselContent>
            {/* Slide 1 - Stats */}
            <CarouselItem>
              <Card className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <CardContent className="p-6 h-48 flex items-center">
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{tr("Missions actives", "Goyey ga dira", "Ayyuka masu aiki")}</p>
                      <p className="text-2xl font-bold text-gray-900">{missionsActives}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{tr("Candidatures", "Naafaley", "Masu nema")}</p>
                      <p className="text-2xl font-bold text-gray-900">{candidaturesRecues}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{tr("Terminées", "Timmante", "An kammala")}</p>
                      <p className="text-2xl font-bold text-gray-900">{missionsTerminees}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{tr("Note", "Nota", "Maki")}</p>
                      <div className="flex items-center gap-1">
                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                        <p className="text-2xl font-bold text-gray-900">{profile.notesMoyenne}</p>
                        <span className="text-sm text-gray-500">/5</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>

            {/* Slide 2 - Image */}
            <CarouselItem>
              <Card className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <div className="h-48 relative">
                  <img
                    src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&auto=format&fit=crop"
                    alt="Entreprise"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-green-900/50 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      <h3 className="text-xl font-bold mb-1">{tr("Gérez vos missions", "Juwal ni goyey", "Sarrafa ayyukanku")}</h3>
                      <p className="text-sm text-white/80">{tr("Publiez et suivez facilement", "Cebbey", "Wallafa da bibiya cikin sauki")}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </CarouselItem>

            {/* Slide 3 - Image */}
            <CarouselItem>
              <Card className="bg-white shadow-lg rounded-2xl overflow-hidden">
                <div className="h-48 relative">
                  <img
                    src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop"
                    alt="Talents"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-blue-900/50 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      <h3 className="text-xl font-bold mb-1">{tr("Trouvez les meilleurs talents", "Ceeci kokariyey", "Nemo mafi kyawun hazaka")}</h3>
                      <p className="text-sm text-white/80">{tr("Des profils qualifiés à portée de main", "Kokariyey", "Ƙwararrun mutane a hannunka")}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      </div>

      <div className="container mx-auto px-4 relative pb-20 md:pb-6">

        {/* Menu latéral */}
        {isMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-[70] overflow-y-auto">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-lg">Menu</span>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    ✕
                  </button>
                </div>
                <div className="px-2 py-3 border-t flex flex-col items-center text-center">
                  <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <Building2 className="size-10 text-green-700" />
                  </div>
                  <p className="font-semibold">{entrepriseNomAffiche}</p>
                  <p className="text-sm text-gray-500">{currentUser.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="size-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-medium">{profile.notesMoyenne}/5</span>
                    <span className="text-xs text-gray-500">({profile.nombreEvaluations} avis)</span>
                  </div>
                </div>
              </div>
              <nav className="p-4 space-y-2">
                <Link to="/dashboard-entreprise" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg">
                    <Briefcase className="size-5 text-gray-700" />
                    <span>{tr("Accueil", "Gida", "Gida")}</span>
                  </div>
                </Link>
                <Link to="/publier-mission" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg">
                    <Plus className="size-5 text-gray-700" />
                    <span>{tr("Publier mission", "Goy cebbey", "Wallafa aiki")}</span>
                  </div>
                </Link>
                <Link to="/entreprise/missions?status=ouverte" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg">
                    <Users className="size-5 text-gray-700" />
                    <span>{tr("Mes missions", "Ay goyey", "Ayyukana")}</span>
                  </div>
                </Link>
                <Link to="/profile-entreprise" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg">
                    <Building2 className="size-5 text-gray-700" />
                    <span>{tr("Mon profil", "Ay profil", "Bayanina")}</span>
                  </div>
                </Link>
                <div className="border-t my-2" />
                <Link to="/" onClick={() => { setIsMenuOpen(false); clearAuthUser(); }}>
                  <div className="flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg text-red-600">
                    <LogOut className="size-5" />
                    <span>{tr("Déconnexion", "Fatta", "Fita")}</span>
                  </div>
                </Link>
              </nav>
            </div>
          </>
        )}

        {/* Stats Cards - supprimées car maintenant dans la carte fixe */}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Missions actives */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{tr("Mes missions actives", "Ay goyey ga dira", "Ayyukana masu aiki")}</CardTitle>
                  <Link to="/publier-mission">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="size-4 mr-2" />
                      {tr("Nouvelle", "Taaga", "Sabo")}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {mesMissions.filter(m => m.statut === "ouverte").map((mission) => (
                  <div key={mission.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{mission.titre}</h3>
                        <p className="text-sm text-gray-600 mt-1">{mission.duree} • {mission.lieu}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">{mission.statut}</Badge>
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-2">{mission.description}</p>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="size-4" />
                          {mission.candidaturesCount}/{mission.maxCandidatures}
                        </span>
                        <span className="font-semibold text-green-700">
                          {mission.remuneration.toLocaleString()} F
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/gerer-candidatures/${mission.id}`}>
                          <Button size="sm" variant="outline">
                            {tr("Gérer", "Juwal", "Sarrafa")}
                          </Button>
                        </Link>
                        <Button size="sm" onClick={() => handleCompleteMission(mission)}>
                          {tr("Terminer", "Timma", "Kammala")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {mesMissions.filter(m => m.statut === "ouverte").length === 0 && (
                  <div className="text-center py-8">
                    <Briefcase className="size-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">{tr("Aucune mission active", "Goy dira kul si", "Babu aiki mai gudana")}</p>
                    <Link to="/publier-mission">
                      <Button className="bg-green-600 hover:bg-green-700">
                        {tr("Publier une mission", "Goy cebbey", "Wallafa aiki")}
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Candidatures récentes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{tr("Candidatures récentes", "Naafaley taagantey", "Neman aiki na baya-bayan nan")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidatures.filter(c => c.statut === "en_attente").slice(0, 3).map((cand) => {
                  const mission = mesMissions.find(m => m.id === cand.missionId);
                  return (
                    <div key={cand.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="size-5 text-indigo-700" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{cand.jeunePrenom} {cand.jeuneNom}</h4>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Star className="size-3 text-yellow-500 fill-yellow-500" />
                              {cand.jeuneNote}/5
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{mission?.titre}</p>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleAcceptCandidate(cand.id)}
                        >
                          {tr("Accepter", "Taaba", "Amince")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleRejectCandidate(cand.id)}
                        >
                          {tr("Refuser", "Wanya", "Ki")}
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {candidatures.filter(c => c.statut === "en_attente").length === 0 && (
                  <p className="text-sm text-gray-600 text-center py-4">
                    {tr("Aucune candidature en attente", "Naafal kul si ga batu", "Babu neman aiki mai jiran amsa")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
