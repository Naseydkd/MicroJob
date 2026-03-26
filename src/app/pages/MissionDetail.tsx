import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Progress } from "../components/ui/progress";
import { 
  Briefcase, MapPin, Clock, DollarSign, Building2, CheckCircle2, 
  ArrowLeft, Users, Star, Calendar 
} from "lucide-react";
import { Candidature, Mission } from "../types";
import { getAuthUser } from "../lib/auth";
import { useI18n } from "../lib/i18n";

import { toast } from "sonner";
import { api } from "../lib/api";

export function MissionDetail() {
  const { tr } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const [lettreMotivation, setLettreMotivation] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [mission, setMission] = useState<Mission | null>(null);
  const [mesCandidatures, setMesCandidatures] = useState<Candidature[]>([]);
  const [profile, setProfile] = useState({
    competences: [] as string[],
    notesMoyenne: 0,
    missionsCompletees: 0,
  });
  const authUser = getAuthUser();

  useEffect(() => {
    if (id) {
      api.get<Mission>(`/missions/${id}`)
        .then((data) => setMission(data))
        .catch(console.error);
    }
  }, [id]);
  useEffect(() => {
    if (!authUser?.id) return;
    api.get<any>(`/jeune-profiles/${authUser.id}`)
      .then((data) =>
        setProfile({
          competences: Array.isArray(data?.competences) ? data.competences : [],
          notesMoyenne: Number(data?.notesMoyenne || 0),
          missionsCompletees: Number(data?.missionsCompletees || 0),
        })
      )
      .catch(() => setProfile({ competences: [], notesMoyenne: 0, missionsCompletees: 0 }));
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser?.id) return;
    api.get<Candidature[]>(`/candidatures/jeune/${authUser.id}`)
      .then((data) => setMesCandidatures(Array.isArray(data) ? data : []))
      .catch(() => setMesCandidatures([]));
  }, [authUser?.id]);

  if (!mission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Mission non trouvée</h2>
            <Link to="/missions">
              <Button>{tr("Retour aux missions", "Ye ka goyey do", "Komawa ayyuka")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const matchingSkills = mission.competencesRequises.filter(c => 
    profile.competences.includes(c)
  );
  const matchPercent = Math.round((matchingSkills.length / mission.competencesRequises.length) * 100);
  const progressPercent = Math.min(
    100,
    Math.round((mission.candidaturesCount / Math.max(mission.maxCandidatures, 1)) * 100)
  );
  const isFull = mission.candidaturesCount >= mission.maxCandidatures;
  const isAccepted = mesCandidatures.some(
    (cand) => cand.missionId === mission.id && cand.statut === "acceptée"
  );
  const hasPending = mesCandidatures.some(
    (cand) => cand.missionId === mission.id && cand.statut === "en_attente"
  );

  const handleApply = async () => {
    if (!authUser?.id) {
      toast.error(tr("Session invalide. Reconnectez-vous.", "Session laala. Huru taaga.", "Zaman ya lalace. Sake shiga."));
      return;
    }
    if (lettreMotivation.length < 20) {
      toast.error(tr("Votre lettre de motivation est trop courte", "Ni wasika kayna ga gajji", "Wasikar kwarin gwiwa ta yi gajarta"));
      return;
    }
    if (!mission) return;
    if (isFull) {
      toast.error(tr("Le quota de candidatures est atteint pour cette mission", "Naafal adadi bena timme goy woo se", "An cika adadin masu nema na wannan aiki"));
      return;
    }
    if (isAccepted) {
      toast.error(tr("Votre candidature a déjà été acceptée pour cette mission", "Ni naafal weyga taaba", "An riga an amince da neman ka na wannan aiki"));
      return;
    }
    if (hasPending) {
      toast.error(tr("Vous avez déjà une candidature en attente pour cette mission", "Ni naafal foo go ga batu", "Kana da neman aiki mai jiran amsa a wannan aiki"));
      return;
    }

    setIsApplying(true);
    try {
      await api.post('/applications', {
        missionId: mission.id,
        jeuneId: authUser?.id,
        jeuneNom: authUser?.nom || "",
        jeunePrenom: authUser?.prenom || "",
        jeuneNote: profile.notesMoyenne,
        lettreMotivation,
        statut: "en_attente"
      });
      toast.success(tr("Candidature envoyée avec succès !", "Naafal sanbandi nda boryo!", "An tura neman aiki cikin nasara!"));
      navigate("/mes-candidatures");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || tr("Erreur lors de l'envoi de la candidature", "Laybu naafal sanbandiyan ra", "Kuskure yayin tura neman aiki"));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link to="/missions">
            <Button variant="ghost">
              <ArrowLeft className="size-4 mr-2" />
              Retour aux missions
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{mission.titre}</CardTitle>
                    <p className="text-gray-600 flex items-center gap-2">
                      <Building2 className="size-4" />
                      {mission.entrepriseNom}
                    </p>
                  </div>
                  {matchPercent >= 60 && (
                    <Badge className="bg-green-100 text-green-700">
                      {matchPercent}% match
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="size-4" />
                    <span>{mission.lieu}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="size-4" />
                    <span>{mission.duree}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="size-4" />
                    <span>{mission.candidaturesCount}/{mission.maxCandidatures} candidatures</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="size-4" />
                    <span>{new Date(mission.dateDebut).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">{tr("Description", "Bayray", "Bayani")}</h3>
                  <p className="text-gray-700 leading-relaxed">{mission.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">{tr("Compétences requises", "Kokariyey ga tilas", "Kwarewar da ake bukata")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {mission.competencesRequises.map((skill, i) => {
                      const isMatching = profile.competences.includes(skill);
                      return (
                        <Badge 
                          key={i} 
                          variant={isMatching ? "default" : "outline"}
                          className={isMatching ? "bg-green-600" : ""}
                        >
                          {skill}
                          {isMatching && <CheckCircle2 className="size-3 ml-1" />}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">{tr("Progression des candidatures", "Naafaley ganda", "Ci gaban neman aiki")}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{mission.candidaturesCount} sur {mission.maxCandidatures}</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tr("Postuler à cette mission", "Naafal goy woo se", "Nemi wannan aiki")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="motivation">{tr("Lettre de motivation *", "Ni wasika *", "Wasikar kwarin gwiwa *")}</Label>
                  <Textarea
                    id="motivation"
                    placeholder={tr("Expliquez pourquoi vous êtes le candidat idéal...", "Fay ni dalil ka ni ga hima...", "Bayyana dalilin da yasa kai ne ya dace...")}
                    className="mt-2 min-h-32"
                    value={lettreMotivation}
                    onChange={(e) => setLettreMotivation(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {tr("Minimum 20 caractères", "Harfu 20 ga tilas", "A kalla haruffa 20")}
                  </p>
                </div>

                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700" 
                  size="lg"
                  onClick={handleApply}
                  disabled={isApplying || lettreMotivation.length < 20 || isFull || isAccepted || hasPending}
                >
                  {isApplying
                    ? tr("Envoi en cours...", "Sanbandiyan go...", "Ana aikawa...")
                    : isAccepted
                      ? tr("Mission déjà acceptée", "Goy taaba", "An riga an amince da aiki")
                      : hasPending
                        ? tr("Candidature déjà envoyée", "Naafal taaba sanbandi", "An riga an tura neman aiki")
                        : isFull
                          ? tr("Mission complète", "Goy timme", "Aikin ya cika")
                          : tr("Envoyer ma candidature", "Ay naafal sanbandi", "Tura neman aikina")}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900 flex items-center gap-2">
                  <DollarSign className="size-5" />
                  {tr("Rémunération", "Banni", "Albashi")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-700">
                  {mission.remuneration.toLocaleString()} FCFA
                </p>
                <p className="text-sm text-green-800 mt-2">
                  {tr("Paiement à la fin de la mission", "Banandi go bena", "Biya a karshen aiki")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{tr("Votre profil", "Ni profil", "Bayananka")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Match</span>
                    <span className="font-bold text-lg">{matchPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${matchPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compétences correspondantes</span>
                    <span className="font-medium">{matchingSkills.length}/{mission.competencesRequises.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Votre note</span>
                    <span className="flex items-center gap-1">
                      <Star className="size-3 text-yellow-500 fill-yellow-500" />
                      {profile.notesMoyenne}/5
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Missions complétées</span>
                    <span className="font-medium">{profile.missionsCompletees}</span>
                  </div>
                </div>

                {matchPercent >= 70 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      <span className="font-semibold">Excellent !</span> Profil très compatible
                    </p>
                  </div>
                ) : matchPercent >= 40 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Bon potentiel</span>
                    </p>
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm text-orange-800">
                      Certaines compétences à développer
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
