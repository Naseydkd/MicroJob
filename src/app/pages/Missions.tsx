import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import { Briefcase, MapPin, Clock, DollarSign, Search, Users } from "lucide-react";
import { Candidature, Mission } from "../types";
import { getAuthUser } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { api } from "../lib/api";

export function Missions() {
  const { tr } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [competences, setCompetences] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const authUser = getAuthUser();

  useEffect(() => {
    setLoading(true);
    api.get<Mission[]>('/missions')
      .then((data) => {
        console.log('Missions chargées:', data);
        setMissions(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Erreur chargement missions:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!authUser?.id) return;
    api.get<any>(`/jeune-profiles/${authUser.id}`)
      .then((data) => setCompetences(Array.isArray(data?.competences) ? data.competences : []))
      .catch(() => setCompetences([]));
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser?.id) return;
    api.get<Candidature[]>(`/candidatures/jeune/${authUser.id}`)
      .then((data) => setCandidatures(Array.isArray(data) ? data : []))
      .catch(() => setCandidatures([]));
  }, [authUser?.id]);

  const acceptedMissionIds = new Set(
    Array.isArray(candidatures) 
      ? candidatures.filter((c) => c.statut === "acceptée").map((c) => c.missionId)
      : []
  );

  const filteredMissions = missions.filter(mission => {
    const matchesSearch = mission.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === "all" || mission.lieu?.includes(locationFilter);
    return matchesSearch && matchesLocation && mission.statut === "ouverte" && !acceptedMissionIds.has(mission.id);
  });

  console.log('Total missions:', missions.length);
  console.log('Missions filtrées:', filteredMissions.length);
  console.log('Missions acceptées:', acceptedMissionIds.size);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard-jeune" className="flex items-center gap-2">
            <div className="size-10 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center">
              <Briefcase className="size-5 text-white" />
            </div>
            <span className="font-bold text-xl">Microjob</span>
          </Link>
          <Link to="/dashboard-jeune">
            <Button variant="ghost">{tr("← Retour", "← Ye banda", "← Komawa")}</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">{tr("Missions Disponibles", "Goyey ga du", "Ayyukan da suke akwai")}</h1>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une mission..."
                  
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={tr("Localisation", "Nungu", "Wuri")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tr("Toutes les villes", "Kwaarey kulu", "Dukkan garuruwa")}</SelectItem>
                  <SelectItem value="Niamey">Niamey</SelectItem>
                  <SelectItem value="À distance">{tr("À distance", "Ganda", "Nesa")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <span>{tr("Chargement des missions…", "Goyey goo ma...", "Ana loda ayyuka...")}</span>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredMissions.map((mission) => {
            const matchingSkills = mission.competencesRequises.filter(c => 
              competences.includes(c)
            );
            const matchPercent = Math.round((matchingSkills.length / mission.competencesRequises.length) * 100);
            const progressPercent = Math.min(
              100,
              Math.round((mission.candidaturesCount / Math.max(mission.maxCandidatures, 1)) * 100)
            );
            const isFull = mission.candidaturesCount >= mission.maxCandidatures;

            return (
              <Card key={mission.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{mission.titre}</CardTitle>
                      <CardDescription className="mt-1">{mission.entrepriseNom}</CardDescription>
                    </div>
                    {matchPercent >= 60 && (
                      <Badge className="bg-green-100 text-green-700">
                        {matchPercent}% match
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700 line-clamp-2">{mission.description}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {mission.competencesRequises.map((comp, i) => (
                      <Badge 
                        key={i} 
                        variant="outline"
                        className={competences.includes(comp) ? "border-green-500 text-green-700" : ""}
                      >
                        {comp}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="size-4" />
                      <span className="truncate">{mission.lieu}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="size-4" />
                      <span>{mission.duree}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="size-4" />
                      <span>{mission.candidaturesCount}/{mission.maxCandidatures} candidatures</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="size-4" />
                      <span className="font-semibold">{mission.remuneration.toLocaleString()} F</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{tr("Progression des candidatures", "Naafaley ganda", "Ci gaban neman aiki")}</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} />
                  </div>

                  {isFull ? (
                    <Button className="w-full" disabled>
                      Mission complète
                    </Button>
                  ) : (
                    <Link to={`/missions/${mission.id}`}>
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                        Voir et postuler
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        )}

        {filteredMissions.length === 0 && (
          <Card className="py-12">
            <CardContent className="text-center">
              <Briefcase className="size-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Pas de mission pour l'instant</h3>
              <p className="text-gray-600 mb-4">{tr("Revenez plus tard pour voir les nouvelles missions", "Ye ka koy banda goy taaga se", "Ka dawo daga baya don ganin sabbin ayyuka")}</p>
              <Button onClick={() => { setSearchTerm(""); setLocationFilter("all"); }}>
                {tr("Réinitialiser les filtres", "Ceeciyaney ye ka sintin taaga", "Sake saita tacewa")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
