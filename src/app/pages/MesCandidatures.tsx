import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Briefcase, ArrowLeft, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Candidature, Mission } from "../types";
import { getAuthUser } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { api } from "../lib/api";

export function MesCandidatures() {
  const { tr } = useI18n();
  const [mesCandidatures, setMesCandidatures] = useState<Candidature[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const authUser = getAuthUser();
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.userType === "entreprise") return <Navigate to="/dashboard-entreprise" replace />;

  useEffect(() => {
    if (!authUser?.id) return;
    api.get<Candidature[]>(`/candidatures/jeune/${authUser.id}`)
      .then(async (data) => {
        const items = Array.isArray(data) ? data : [];
        const withMission = await Promise.all(
          items.map(async (cand) => {
            try {
              const mission = await api.get<Mission>(`/missions/${cand.missionId}`);
              return { ...cand, mission };
            } catch {
              return cand;
            }
          })
        );
        setMesCandidatures(withMission);
      })
      .catch(() => setMesCandidatures([]));
  }, [authUser?.id]);

  const enAttente = mesCandidatures.filter((c) => c.statut === "en_attente");
  const acceptees = mesCandidatures.filter((c) => c.statut === "acceptée");
  const refusees = mesCandidatures.filter((c) => c.statut === "refusée");
  const statusParam = searchParams.get("status");
  const tabValue =
    statusParam === "acceptée"
      ? "acceptees"
      : statusParam === "refusée"
        ? "refusees"
        : "attente";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link to="/dashboard-jeune">
            <Button variant="ghost">
              <ArrowLeft className="size-4 mr-2" />
              {tr("Retour au dashboard", "Ye ka tableau do", "Komawa dashboard")}
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">{tr("Mes Candidatures", "Ay Naafaley", "Neman aikina")}</h1>

        <Tabs
          value={tabValue}
          onValueChange={(value) => {
            const nextStatus =
              value === "acceptees"
                ? "acceptée"
                : value === "refusees"
                  ? "refusée"
                  : "en_attente";
            setSearchParams({ status: nextStatus });
          }}
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="attente">
              {tr("En attente", "Ga batu", "Ana jira")} ({enAttente.length})
            </TabsTrigger>
            <TabsTrigger value="acceptees">
              {tr("Acceptées", "Taabantey", "Wadanda aka amince")} ({acceptees.length})
            </TabsTrigger>
            <TabsTrigger value="refusees">
              {tr("Refusées", "Wanyantey", "Wadanda aka ki")} ({refusees.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attente" className="space-y-4">
            {enAttente.map(cand => (
              <Card key={cand.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{cand.mission?.titre}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{cand.mission?.entrepriseNom}</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700">
                      <Clock className="size-3 mr-1" />
                      {tr("En attente", "Ga batu", "Ana jira")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-3">
                    <span className="font-semibold">{tr("Votre motivation :", "Ni dalili:", "Dalilinka:")}</span> {cand.lettreMotivation}
                  </p>
                  <p className="text-xs text-gray-500">{tr("Postulé le", "Naafal han", "An nema a")} {cand.datePostulation}</p>
                </CardContent>
              </Card>
            ))}
            {enAttente.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600">{tr("Aucune candidature en attente", "Naafal kul si ga batu", "Babu neman aiki da ke jiran amsa")}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="acceptees" className="space-y-4">
            {acceptees.map(cand => (
              <Card key={cand.id} className="border-green-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{cand.mission?.titre}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{cand.mission?.entrepriseNom}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="size-3 mr-1" />
                      {tr("Acceptée", "Taaba", "An amince")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold text-green-700 mb-2">
                    {tr("Félicitations ! Votre candidature a été acceptée.", "Barka! Ni naafal taaba.", "Murna! An amince da neman aikinka.")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tr("Acceptée le", "Taaba han", "An amince a")} {cand.dateReponse}
                  </p>
                </CardContent>
              </Card>
            ))}
            {acceptees.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600">{tr("Aucune candidature acceptée", "Naafal kul si taaba", "Babu neman aiki da aka amince da shi")}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="refusees" className="space-y-4">
            {refusees.map(cand => (
              <Card key={cand.id} className="border-gray-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-gray-700">{cand.mission?.titre}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{cand.mission?.entrepriseNom}</p>
                    </div>
                    <Badge variant="outline" className="text-gray-600">
                      <XCircle className="size-3 mr-1" />
                      {tr("Refusée", "Wanya", "An ki")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">{tr("Motif du refus :", "Waneyan dalili:", "Dalilin kin amincewa:")}</span>{" "}
                    {cand.motifRefus?.trim() ? cand.motifRefus : tr("Aucun motif fourni", "Dalili kul si", "Ba a bayar da dalili ba")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tr("Refusée le", "Wanya han", "An ki a")} {cand.dateReponse}
                  </p>
                </CardContent>
              </Card>
            ))}
            {refusees.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-600">{tr("Aucune candidature refusée", "Naafal kul si wanya", "Babu neman aiki da aka ki")}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
