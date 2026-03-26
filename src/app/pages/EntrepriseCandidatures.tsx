import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, FileText, Star } from "lucide-react";
import { Candidature, Mission } from "../types";
import { getAuthUser } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { api } from "../lib/api";

export function EntrepriseCandidatures() {
  const { tr } = useI18n();
  const authUser = getAuthUser();
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.userType === "jeune") return <Navigate to="/dashboard-jeune" replace />;

  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || "en_attente";
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [missionsById, setMissionsById] = useState<Record<string, Mission>>({});

  useEffect(() => {
    api.get<Candidature[]>(`/candidatures/entreprise/${authUser.id}`)
      .then((data) => setCandidatures(Array.isArray(data) ? data : []))
      .catch(() => setCandidatures([]));
  }, [authUser.id]);

  useEffect(() => {
    api.get<Mission[]>("/missions")
      .then((data) => {
        const map: Record<string, Mission> = {};
        (Array.isArray(data) ? data : [])
          .filter((m) => m.entrepriseId === authUser.id)
          .forEach((m) => {
            map[m.id] = m;
          });
        setMissionsById(map);
      })
      .catch(() => setMissionsById({}));
  }, [authUser.id]);

  const filtered = useMemo(() => candidatures.filter((c) => c.statut === status), [candidatures, status]);
  const title =
    status === "acceptée"
      ? tr("Candidatures acceptées", "Naafaley taabantey", "Neman aikin da aka amince")
      : status === "refusée"
        ? tr("Candidatures refusées", "Naafaley wanyantey", "Neman aikin da aka ki")
        : tr("Candidatures reçues", "Naafaley du", "Neman aikin da aka karba");

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
          {filtered.map((cand) => (
            <Card key={cand.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {cand.jeunePrenom} {cand.jeuneNom}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{missionsById[cand.missionId]?.titre ?? cand.missionId}</p>
                  </div>
                  <Badge variant="outline">{cand.statut}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Star className="size-4 text-yellow-500 fill-yellow-500" />
                  <span>{cand.jeuneNote}/5</span>
                </div>
                <p className="text-sm text-gray-700">{cand.lettreMotivation}</p>
                {cand.statut === "refusée" && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{tr("Motif du refus :", "Waneyan dalili:", "Dalilin kin amincewa:")}</span>{" "}
                    {cand.motifRefus?.trim() ? cand.motifRefus : tr("Aucun motif", "Dalili kul si", "Babu dalili")}
                  </p>
                )}
                <p className="text-xs text-gray-500">{tr("Postulé le", "Naafal han", "An nema a")} {cand.datePostulation}</p>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="size-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">{tr("Aucune candidature pour ce filtre", "Naafal kul si ceeciyan woo se", "Babu neman aiki ga wannan tacewa")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
