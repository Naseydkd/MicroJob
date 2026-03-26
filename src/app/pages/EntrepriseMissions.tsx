import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Briefcase, ArrowLeft, MapPin, Clock, Users, DollarSign } from "lucide-react";
import { Mission } from "../types";
import { getAuthUser } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { api } from "../lib/api";

export function EntrepriseMissions() {
  const { tr } = useI18n();
  const authUser = getAuthUser();
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.userType === "jeune") return <Navigate to="/dashboard-jeune" replace />;

  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || "ouverte";
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    api.get<Mission[]>("/missions")
      .then((data) =>
        setMissions(Array.isArray(data) ? data.filter((m) => m.entrepriseId === authUser.id) : [])
      )
      .catch(() => setMissions([]));
  }, [authUser.id]);

  const filtered = useMemo(() => {
    if (status === "terminee") return missions.filter((m) => m.statut === "terminée");
    if (status === "en_cours") return missions.filter((m) => m.statut === "en_cours");
    return missions.filter((m) => m.statut === "ouverte");
  }, [missions, status]);

  const title =
    status === "terminee"
      ? tr("Missions terminées", "Goyey timmante", "Ayyukan da aka kammala")
      : status === "en_cours"
        ? tr("Missions en cours", "Goyey ga tee", "Ayyukan da ke gudana")
        : tr("Missions actives", "Goyey ga dira", "Ayyuka masu aiki");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link to="/dashboard-entreprise">
            <Button variant="ghost">
              <ArrowLeft className="size-4 mr-2" />
              {tr("Retour au dashboard", "Ye ka tableau do", "Komawa dashboard")}
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>

        <div className="space-y-4">
          {filtered.map((mission) => (
            <Card key={mission.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{mission.titre}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{mission.entrepriseNom}</p>
                  </div>
                  <Badge variant="outline">{mission.statut}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700">{mission.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="size-4" />
                    <span>{mission.lieu}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="size-4" />
                    <span>{mission.duree}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="size-4" />
                    <span>{mission.candidaturesCount}/{mission.maxCandidatures} {tr("candidatures", "naafaley", "masu nema")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="size-4" />
                    <span>{mission.remuneration.toLocaleString()} FCFA</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link to={`/gerer-candidatures/${mission.id}`}>
                    <Button size="sm" variant="outline">
                      {tr("Voir les candidatures", "Naafaley guna", "Duba masu nema")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="size-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">{tr("Aucune mission pour ce filtre", "Goy kul si ceeciyan woo se", "Babu aiki ga wannan tacewa")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
