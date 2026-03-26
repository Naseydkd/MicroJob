import { Link, Navigate, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
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
  Search,
  Star,
  CheckCircle2,
  Clock,
  LogOut,
  Menu
} from "lucide-react";
import { clearAuthUser, getAuthUser, saveAuthUser } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { api } from "../lib/api";
import { BottomNav } from "../components/BottomNav";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

interface Mission {
  id: string;
  titre: string;
  description: string;
  remuneration: number;
  duree: string;
  lieu: string;
  statut: string;
  entrepriseId: string;
  entrepriseNom: string;
  competencesRequises: string[];
  candidaturesCount: number;
  maxCandidatures: number;
}

interface Candidature {
  id: string;
  missionId: string;
  jeuneId: string;
  jeuneNom: string;
  jeunePrenom: string;
  jeuneNote: number;
  statut: string;
  motifRefus?: string;
}

export function DashboardJeune() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const authUser = getAuthUser();
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.userType === "entreprise") return <Navigate to="/dashboard-entreprise" replace />;
  
  const [currentUser, setCurrentUser] = useState({
    id: authUser?.id ?? "",
    email: authUser?.email ?? "",
    nom: authUser?.nom ?? "",
    prenom: authUser?.prenom ?? "",
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!carouselApi) return;
    const interval = setInterval(() => carouselApi.scrollNext(), 5000);
    return () => clearInterval(interval);
  }, [carouselApi]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [profile, setProfile] = useState({
    competences: [] as string[],
    notesMoyenne: 0,
    missionsCompletees: 0,
  });

  useEffect(() => {
    if (!currentUser.id) return;
    api.get<any>(`/users/${currentUser.id}`)
      .then((data) => {
        const nextUser = {
          id: data.userId,
          email: data.email,
          nom: data.nom ?? "",
          prenom: data.prenom ?? "",
        };
        setCurrentUser(nextUser);
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
    api.get<any[]>(`/notifications/${currentUser.id}`)
      .then((data) => setUnreadNotifs(data.filter((n: any) => !n.lu).length))
      .catch(() => setUnreadNotifs(0));
  }, [currentUser.id]);

  useEffect(() => {
    api.get<Mission[]>("/missions")
      .then((data) => setMissions(data || []))
      .catch(() => setMissions([]));
  }, []);

  useEffect(() => {
    if (!currentUser.id) return;
    api.get<Candidature[]>(`/candidatures/jeune/${currentUser.id}`)
      .then((data) => setCandidatures(Array.isArray(data) ? data : []))
      .catch(() => setCandidatures([]));
  }, [currentUser.id]);

  useEffect(() => {
    if (!currentUser.id) return;
    api.get<any>(`/jeune-profiles/${currentUser.id}`)
      .then((data) =>
        setProfile({
          competences: Array.isArray(data?.competences) ? data.competences : [],
          notesMoyenne: Number(data?.notesMoyenne || 0),
          missionsCompletees: Number(data?.missionsCompletees || 0),
        })
      )
      .catch(() => setProfile({ competences: [], notesMoyenne: 0, missionsCompletees: 0 }));
  }, [currentUser.id]);

  const acceptedMissionIds = useMemo(
    () => new Set(
      Array.isArray(candidatures) 
        ? candidatures.filter((c) => c.statut === "acceptée").map((c) => c.missionId)
        : []
    ),
    [candidatures]
  );
  
  const openMissions = useMemo(
    () =>
      missions.filter(
        (m) =>
          m.statut === "ouverte" &&
          !acceptedMissionIds.has(m.id) &&
          m.candidaturesCount < m.maxCandidatures
      ),
    [missions, acceptedMissionIds]
  );
  
  const stats = useMemo(() => ({
    missionsDisponibles: openMissions.length,
    candidaturesEnCours: candidatures.filter((c) => c.statut === "en_attente").length,
    missionsAcceptees: candidatures.filter((c) => c.statut === "acceptée").length,
    noteMoyenne: profile.notesMoyenne,
  }), [openMissions.length, candidatures, profile.notesMoyenne]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-b-3xl pb-20">
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
                <p className="text-white text-base font-bold uppercase tracking-wide">{currentUser.prenom}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button aria-label="Notifications" className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="size-5 text-white" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full" />
                )}
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
                      <p className="text-sm text-gray-600 mb-1">{tr("Disponibles", "Ga du", "Akwai")}</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.missionsDisponibles}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{tr("En attente", "Ga batu", "Ana jira")}</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.candidaturesEnCours}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{tr("Acceptées", "Taabantey", "An amince")}</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.missionsAcceptees}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{tr("Note", "Nota", "Maki")}</p>
                      <div className="flex items-center gap-1">
                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                        <p className="text-2xl font-bold text-gray-900">{stats.noteMoyenne}</p>
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
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop"
                    alt="Missions"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-indigo-900/50 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      <h3 className="text-xl font-bold mb-1">{tr("Trouvez votre mission", "Ceeci ni goy", "Nemo aikin ku")}</h3>
                      <p className="text-sm text-white/80">{tr("Des opportunités adaptées à votre profil", "Dammey", "Damar da suka dace")}</p>
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
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop"
                    alt="Compétences"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-purple-900/50 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      <h3 className="text-xl font-bold mb-1">{tr("Développez vos compétences", "Kokariyey", "Haɓaka ƙwarewarku")}</h3>
                      <p className="text-sm text-white/80">{tr("Progressez à chaque mission", "Goy kul", "Ci gaba a kowane aiki")}</p>
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
                  <div className="size-20 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                    <User className="size-10 text-indigo-700" />
                  </div>
                  <p className="font-semibold">{currentUser.prenom} {currentUser.nom}</p>
                  <p className="text-sm text-gray-500">{currentUser.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="size-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-medium">{profile.notesMoyenne}/5</span>
                  </div>
                </div>
              </div>
              <nav className="p-4 space-y-2">
                <Link to="/dashboard-jeune" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg">
                    <Briefcase className="size-5 text-gray-700" />
                    <span>{tr("Accueil", "Gida", "Gida")}</span>
                  </div>
                </Link>
                <Link to="/missions" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg">
                    <Search className="size-5 text-gray-700" />
                    <span>{tr("Missions", "Goyey", "Ayyuka")}</span>
                  </div>
                </Link>
                <Link to="/mes-candidatures" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg">
                    <Briefcase className="size-5 text-gray-700" />
                    <span>{tr("Mes candidatures", "Ay naafaley", "Neman aikina")}</span>
                  </div>
                </Link>
                <Link to="/profile-jeune" onClick={() => setIsMenuOpen(false)}>
                  <div className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg">
                    <User className="size-5 text-gray-700" />
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

        {/* CTA Recherche */}
        <Link to="/missions">
          <Card className="mb-6 bg-gradient-to-r from-indigo-600 to-indigo-700 border-0 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="py-6 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-lg mb-1">{tr("Trouvez votre prochaine mission", "Ni goy jine ceeci", "Nemi aikinka na gaba")}</h3>
                <p className="text-indigo-100 text-sm">
                  {stats.missionsDisponibles > 0
                    ? `${stats.missionsDisponibles} ${tr("opportunités disponibles", "dammey ga du", "damarmaki akwai")}`
                    : tr("Pas de mission pour l'instant", "Goy si sohoy", "Babu aiki a yanzu")}
                </p>
              </div>
              <Search className="size-8 text-white/80" />
            </CardContent>
          </Card>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Missions recommandées */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{tr("Missions recommandées", "Goyey suubantey", "Ayyukan da aka ba ka shawara")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {openMissions.length === 0 && (
                  <div className="text-center py-8">
                    <Briefcase className="size-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">{tr("Pas de mission pour l'instant", "Goy si sohoy", "Babu aiki a yanzu")}</p>
                  </div>
                )}

                {openMissions.slice(0, 5).map((mission) => {
                  const matchingSkills = mission.competencesRequises.filter(c => 
                    profile.competences.includes(c)
                  );
                  const matchPercent = Math.round((matchingSkills.length / mission.competencesRequises.length) * 100);
                  const progressPercent = Math.min(
                    100,
                    Math.round((mission.candidaturesCount / Math.max(mission.maxCandidatures, 1)) * 100)
                  );

                  return (
                    <div key={mission.id} className="border rounded-lg p-4 space-y-3 hover:border-indigo-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{mission.titre}</h3>
                          <p className="text-sm text-gray-600 mt-1">{mission.entrepriseNom}</p>
                        </div>
                        {matchPercent >= 60 && (
                          <Badge className="bg-green-100 text-green-700">
                            {matchPercent}% match
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 line-clamp-2">{mission.description}</p>

                      <div className="flex flex-wrap gap-1.5">
                        {mission.competencesRequises.slice(0, 3).map((comp, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className={profile.competences.includes(comp) ? "border-green-500 text-green-700" : ""}
                          >
                            {comp}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{mission.candidaturesCount}/{mission.maxCandidatures}</span>
                        </div>
                        <Progress value={progressPercent} />
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-lg font-bold text-green-600">
                          {mission.remuneration.toLocaleString()} F
                        </span>
                        <Link to={`/missions/${mission.id}`}>
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                            {tr("Voir", "Guna", "Duba")}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {openMissions.length > 0 && (
                  <Link to="/missions">
                    <Button variant="outline" className="w-full">
                      {tr("Voir toutes les missions", "Goyey kulu guna", "Duba dukkan ayyuka")}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Compétences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{tr("Mes Compétences", "Ay Kokariyey", "Kwarewata")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.competences.slice(0, 6).map((comp, i) => (
                    <Badge key={i} variant="outline">{comp}</Badge>
                  ))}
                </div>
                {profile.competences.length === 0 && (
                  <p className="text-sm text-gray-600 text-center py-4">
                    {tr("Aucune compétence ajoutée", "Kokari kul si tonton", "Ba a kara kwarewa ba")}
                  </p>
                )}
                <Link to="/profile-jeune">
                  <Button variant="ghost" size="sm" className="w-full mt-3">
                    {tr("Gérer", "Juwal", "Sarrafa")}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Mes candidatures */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{tr("Mes candidatures", "Ay naafaley", "Neman aikina")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidatures.slice(0, 3).map((cand) => {
                  const mission = missions.find((m) => m.id === cand.missionId);
                  return (
                    <div key={cand.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{mission?.titre || cand.missionId}</h4>
                        <Badge 
                          className={
                            cand.statut === "acceptée" ? "bg-green-100 text-green-700" :
                            cand.statut === "refusée" ? "bg-red-100 text-red-700" :
                            "bg-orange-100 text-orange-700"
                          }
                        >
                          {cand.statut}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{mission?.entrepriseNom}</p>
                    </div>
                  );
                })}

                {candidatures.length === 0 && (
                  <p className="text-sm text-gray-600 text-center py-4">
                    {tr("Aucune candidature", "Naafal kul si", "Babu neman aiki")}
                  </p>
                )}

                <Link to="/mes-candidatures">
                  <Button variant="ghost" size="sm" className="w-full">
                    {tr("Voir tout", "Kulu guna", "Duba duka")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
