import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, User, Star, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Candidature, Mission } from "../types";
import { getAuthUser } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { api } from "../lib/api";

export function GererCandidatures() {
  const { tr } = useI18n();
  const { missionId } = useParams();
  const authUser = getAuthUser();
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.userType === "jeune") return <Navigate to="/dashboard-jeune" replace />;
  const [mission, setMission] = useState<Mission | null>(null);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingCandidatureId, setRejectingCandidatureId] = useState<string | null>(null);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  useEffect(() => {
    if (!missionId) return;
    api.get<Mission>(`/missions/${missionId}`)
      .then((data) => setMission(data))
      .catch(() => setMission(null));
  }, [missionId]);

  useEffect(() => {
    if (!missionId || !authUser?.id) return;
    api.get<Candidature[]>(`/candidatures/entreprise/${authUser.id}`)
      .then((data) => setCandidatures(Array.isArray(data) ? data.filter(c => c.missionId === missionId) : []))
      .catch(() => setCandidatures([]));
  }, [missionId, authUser?.id]);

  const handleAccept = async (candidatureId: string) => {
    try {
      await api.patch(`/applications/${candidatureId}`, { statut: 'acceptée' });
      setCandidatures(prev => prev.map(c => c.id === candidatureId ? { ...c, statut: 'acceptée' } : c));
      toast.success(tr("Candidature acceptée !", "Naafal taaba!", "An amince da neman aiki!"));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || tr("Échec de l'acceptation", "Taabayan kayya", "An kasa amincewa"));
    }
  };

  const openRejectDialog = (candidatureId: string) => {
    setRejectingCandidatureId(candidatureId);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingCandidatureId) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error(tr("Veuillez justifier le refus", "Waneyan dalili da", "Da fatan a bayyana dalilin kin amincewa"));
      return;
    }

    try {
      setIsSubmittingReject(true);
      await api.patch(`/applications/${rejectingCandidatureId}`, { statut: 'refusée', motifRefus: reason });
      setCandidatures(prev => prev.map(c => c.id === rejectingCandidatureId ? { ...c, statut: 'refusée', motifRefus: reason } : c));
      toast.success(tr("Candidature refusée", "Naafal wanya", "An ki neman aiki"));
      setRejectDialogOpen(false);
      setRejectingCandidatureId(null);
      setRejectReason("");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || tr("Échec du refus", "Waneyan kayya", "An kasa kin amincewa"));
    } finally {
      setIsSubmittingReject(false);
    }
  };

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

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{tr("Candidatures reçues", "Naafaley du", "Neman aiki da aka karba")}</h1>
          <p className="text-gray-600 mt-1">{mission?.titre}</p>
        </div>

        <div className="space-y-4">
          {candidatures.map((cand) => (
            <Card key={cand.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="size-6 text-indigo-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {cand.jeunePrenom} {cand.jeuneNom}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{cand.jeuneNote}/5</span>
                      </div>
                    </div>
                  </div>
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
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2">{tr("Lettre de motivation :", "Dalili wasika:", "Wasikar kwarin gwiwa:")}</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {cand.lettreMotivation}
                  </p>
                </div>

                <div className="text-xs text-gray-500">
                  {tr("Postulé le", "Naafal han", "An nema a")} {cand.datePostulation}
                </div>

                {cand.statut === "en_attente" && (
                  <div className="flex gap-3 pt-3 border-t">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleAccept(cand.id)}
                    >
                      <CheckCircle2 className="size-4 mr-2" />
                      {tr("Accepter", "Taaba", "Amince")}
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => openRejectDialog(cand.id)}
                    >
                      <XCircle className="size-4 mr-2" />
                      {tr("Refuser", "Wanya", "Ki")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {candidatures.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="size-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">{tr("Aucune candidature reçue pour cette mission", "Naafal kul si du goy woo se", "Babu neman aiki da aka karba don wannan aiki")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr("Motif du refus", "Waneyan dalili", "Dalilin kin amincewa")}</DialogTitle>
            <DialogDescription>
              {tr(
                "Merci d'indiquer la raison du refus. Ce message sera visible par le jeune.",
                "Waneyan dalili bayandi. Zanka ga di.",
                "Da fatan a rubuta dalilin kin amincewa. Matashin zai ga wannan sakon."
              )}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={tr(
              "Exemple: Nous avons retenu un profil avec plus d'expérience terrain.",
              "Misal: Ir mana na profil himante foo.",
              "Misali: Mun zabi wani profayil mai karin kwarewar aiki."
            )}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={isSubmittingReject}>
              {tr("Annuler", "Naŋ", "Soke")}
            </Button>
            <Button onClick={handleReject} disabled={isSubmittingReject}>
              {tr("Confirmer le refus", "Wanya tabbatandi", "Tabbatar da kin amincewa")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
