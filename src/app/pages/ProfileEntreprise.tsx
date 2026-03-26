import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Building2, ArrowLeft, Star } from "lucide-react";
import { getAuthUser, saveAuthUser } from "../lib/auth";
import { toast } from "sonner";
import { useI18n } from "../lib/i18n";
import { api } from "../lib/api";

export function ProfileEntreprise() {
  const { tr } = useI18n();
  const authUser = getAuthUser();
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.userType === "jeune") return <Navigate to="/profile-jeune" replace />;
  const [currentUser, setCurrentUser] = useState({
    id: authUser?.id ?? "",
    email: authUser?.email ?? "",
    userType: authUser?.userType ?? "entreprise",
    nom: authUser?.nom ?? "",
    telephone: authUser?.telephone ?? "",
    ville: authUser?.ville ?? "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    nomEntreprise: "",
    secteurActivite: "",
    description: "",
    adresse: "",
    siteWeb: "",
    notesMoyenne: 0,
    nombreEvaluations: 0,
    missionsPubliees: 0,
    email: currentUser.email,
    telephone: currentUser.telephone,
    ville: currentUser.ville,
  });

  useEffect(() => {
    if (!currentUser.id) return;
    api.get<any>(`/users/${currentUser.id}`)
      .then((data) => {
        setCurrentUser({
          id: data.userId,
          email: data.email,
          userType: data.userType,
          nom: data.nom ?? "",
          telephone: data.telephone ?? "",
          ville: data.ville ?? "",
        });
        saveAuthUser({
          id: data.userId,
          email: data.email,
          userType: data.userType,
          nom: data.nom ?? null,
          prenom: data.prenom ?? null,
          telephone: data.telephone ?? null,
          ville: data.ville ?? null,
        });
      })
      .catch(() => undefined);
  }, [currentUser.id]);

  useEffect(() => {
    if (!currentUser.id) return;
    api.get<any>(`/entreprise-profiles/${currentUser.id}`)
      .then((data) =>
        setProfile({
          nomEntreprise: data?.nomEntreprise || "",
          secteurActivite: data?.secteurActivite || "",
          description: data?.description || "",
          adresse: data?.adresse || "",
          siteWeb: data?.siteWeb || "",
          notesMoyenne: Number(data?.notesMoyenne || 0),
          nombreEvaluations: Number(data?.nombreEvaluations || 0),
          missionsPubliees: Number(data?.missionsPubliees || 0),
          email: data?.email || currentUser.email,
          telephone: data?.telephone || currentUser.telephone,
          ville: data?.ville || currentUser.ville,
        })
      )
      .catch(() => undefined);
  }, [currentUser.email, currentUser.id, currentUser.telephone, currentUser.ville]);

  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    try {
      setIsSaving(true);
      const payload = await api.patch<any>(`/entreprise-profiles/${currentUser.id}`, profile);
      setProfile((prev) => ({
        ...prev,
        nomEntreprise: payload.nomEntreprise,
        secteurActivite: payload.secteurActivite,
        description: payload.description,
        adresse: payload.adresse,
        siteWeb: payload.siteWeb,
        notesMoyenne: payload.notesMoyenne,
        nombreEvaluations: payload.nombreEvaluations,
        missionsPubliees: payload.missionsPubliees,
        email: payload.email,
        telephone: payload.telephone,
        ville: payload.ville,
      }));
      saveAuthUser({
        id: payload.userId,
        email: payload.email,
        userType: "entreprise",
        nom: payload.nomEntreprise ?? null,
        prenom: null,
        telephone: payload.telephone ?? null,
        ville: payload.ville ?? null,
      });
      setCurrentUser((prev) => ({
        ...prev,
        id: payload.userId,
        email: payload.email,
        nom: payload.nomEntreprise ?? prev.nom,
        telephone: payload.telephone ?? prev.telephone,
        ville: payload.ville ?? prev.ville,
      }));
      setIsEditing(false);
      toast.success(tr("Profil mis à jour", "Profil taaga", "An sabunta bayanan profayil"));
    } catch (error: any) {
      toast.error(error?.message || tr("Erreur réseau", "Reso laybu", "Kuskuren hanyar sadarwa"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard-entreprise">
            <Button variant="ghost">
              <ArrowLeft className="size-4 mr-2" />
              {tr("Retour", "Ye banda", "Komawa")}
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            {isSaving
              ? tr("Enregistrement...", "Gaabandi...", "Ana adanawa...")
              : isEditing
                ? tr("Enregistrer", "Gaabu", "Ajiye")
                : tr("Modifier", "Barmay", "Gyara")}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex flex-col items-center mb-8">
          <div className="size-24 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Building2 className="size-12 text-green-700" />
          </div>
          <h1 className="text-2xl font-bold">{profile.nomEntreprise}</h1>
          <p className="text-gray-600">{profile.secteurActivite}</p>
          <div className="flex items-center gap-1 mt-2">
            <Star className="size-4 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">{profile.notesMoyenne}/5</span>
            <span className="text-gray-500 text-sm">({profile.nombreEvaluations} {tr("avis", "bayray", "ra'ayi")})</span>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{tr("Informations de l'entreprise", "Kompani alhabarey", "Bayanan kamfani")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{tr("Nom de l'entreprise", "Kompani maa", "Sunan kamfani")}</Label>
                <Input value={profile.nomEntreprise} onChange={(e) => setProfile((p) => ({ ...p, nomEntreprise: e.target.value }))} disabled={!isEditing} className="mt-1" />
              </div>
              <div>
                <Label>{tr("Secteur d'activité", "Goy fanni", "Fannin aiki")}</Label>
                <Input value={profile.secteurActivite} onChange={(e) => setProfile((p) => ({ ...p, secteurActivite: e.target.value }))} disabled={!isEditing} className="mt-1" />
              </div>
              <div>
                <Label>{tr("Description", "Bayray", "Bayani")}</Label>
                <Textarea value={profile.description} onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))} disabled={!isEditing} className="mt-1" />
              </div>
              <div>
                <Label>{tr("Adresse", "Do", "Adireshi")}</Label>
                <Input value={profile.adresse} onChange={(e) => setProfile((p) => ({ ...p, adresse: e.target.value }))} disabled={!isEditing} className="mt-1" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{tr("Email", "Email", "Imel")}</Label>
                  <Input value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} disabled={!isEditing} className="mt-1" />
                </div>
                <div>
                  <Label>{tr("Téléphone", "Talon", "Waya")}</Label>
                  <Input value={profile.telephone} onChange={(e) => setProfile((p) => ({ ...p, telephone: e.target.value }))} disabled={!isEditing} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>{tr("Ville", "Kwaara", "Gari")}</Label>
                <Input value={profile.ville} onChange={(e) => setProfile((p) => ({ ...p, ville: e.target.value }))} disabled={!isEditing} className="mt-1" />
              </div>
              <div>
                <Label>{tr("Site web", "Web nungu", "Shafin yanar gizo")}</Label>
                <Input value={profile.siteWeb} onChange={(e) => setProfile((p) => ({ ...p, siteWeb: e.target.value }))} disabled={!isEditing} className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tr("Statistiques", "Lissaafey", "Kididdiga")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{profile.missionsPubliees}</p>
                  <p className="text-sm text-gray-600 mt-1">{tr("Missions publiées", "Goyey cebante", "Ayyukan da aka wallafa")}</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-indigo-600">{profile.notesMoyenne}</p>
                  <p className="text-sm text-gray-600 mt-1">{tr("Note moyenne", "Hima talfi", "Matsakaicin maki")}</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">{profile.nombreEvaluations}</p>
                  <p className="text-sm text-gray-600 mt-1">{tr("Évaluations", "Himandiyaney", "Kimantawa")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
