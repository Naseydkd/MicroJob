import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { ArrowLeft, User, Star } from "lucide-react";
import { toast } from "sonner";
import { getAuthUser, saveAuthUser } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { api } from "../lib/api";

export function ProfileJeune() {
  const { tr } = useI18n();
  const authUser = getAuthUser();
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.userType === "entreprise") return <Navigate to="/profile-entreprise" replace />;
  const [currentUser, setCurrentUser] = useState({
    id: authUser?.id ?? "",
    email: authUser?.email ?? "",
    nom: authUser?.nom ?? "",
    prenom: authUser?.prenom ?? "",
    telephone: authUser?.telephone ?? "",
    ville: authUser?.ville ?? "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nom: String(currentUser.nom ?? ""),
    prenom: String(currentUser.prenom ?? ""),
    email: String(currentUser.email ?? ""),
    telephone: String(currentUser.telephone ?? ""),
    ville: String(currentUser.ville ?? ""),
  });
  const [newCompetence, setNewCompetence] = useState("");
  const [profileData, setProfileData] = useState({
    education: "",
    experience: "",
    competences: [] as string[],
    notesMoyenne: 0,
    nombreEvaluations: 0,
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
          telephone: data.telephone ?? "",
          ville: data.ville ?? "",
        };
        setCurrentUser(nextUser);
        setFormData({
          nom: nextUser.nom,
          prenom: nextUser.prenom,
          email: nextUser.email,
          telephone: nextUser.telephone,
          ville: nextUser.ville,
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
    api.get<any>(`/jeune-profiles/${currentUser.id}`)
      .then((data) =>
        setProfileData({
          education: data.education || "",
          experience: data.experience || "",
          competences: Array.isArray(data.competences) ? data.competences : [],
          notesMoyenne: Number(data.notesMoyenne || 0),
          nombreEvaluations: Number(data.nombreEvaluations || 0),
          missionsCompletees: Number(data.missionsCompletees || 0),
        })
      )
      .catch(() => undefined);
  }, [currentUser.id]);

  const addCompetence = () => {
    const value = newCompetence.trim();
    if (!value) return;
    if (profileData.competences.includes(value)) return;
    setProfileData((prev) => ({ ...prev, competences: [...prev.competences, value] }));
    setNewCompetence("");
  };

  const removeCompetence = (competence: string) => {
    setProfileData((prev) => ({
      ...prev,
      competences: prev.competences.filter((c) => c !== competence),
    }));
  };

  const handleToggleEdit = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!formData.nom || !formData.prenom || !formData.email || !formData.telephone || !formData.ville) {
      toast.error(tr("Veuillez remplir tous les champs", "Taari kulu cika", "Cika dukkan filaye"));
      return;
    }

    try {
      setIsSaving(true);
      const userPayload = await api.patch<any>(`/users/${currentUser.id}`, {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim().toLowerCase(),
        telephone: formData.telephone.trim(),
        ville: formData.ville.trim(),
      });

      const profilePayload = await api.patch<any>(`/jeune-profiles/${currentUser.id}`, {
        education: profileData.education,
        experience: profileData.experience,
        competences: profileData.competences,
      });

      saveAuthUser({
        id: userPayload.userId,
        email: userPayload.email,
        userType: userPayload.userType,
        nom: userPayload.nom ?? null,
        prenom: userPayload.prenom ?? null,
        telephone: userPayload.telephone ?? null,
        ville: userPayload.ville ?? null,
      });
      setCurrentUser({
        id: userPayload.userId,
        email: userPayload.email,
        nom: userPayload.nom ?? "",
        prenom: userPayload.prenom ?? "",
        telephone: userPayload.telephone ?? "",
        ville: userPayload.ville ?? "",
      });

      setFormData({
        nom: userPayload.nom ?? "",
        prenom: userPayload.prenom ?? "",
        email: userPayload.email ?? "",
        telephone: userPayload.telephone ?? "",
        ville: userPayload.ville ?? "",
      });
      setProfileData((prev) => ({
        ...prev,
        education: profilePayload.education ?? prev.education,
        experience: profilePayload.experience ?? prev.experience,
        competences: Array.isArray(profilePayload.competences) ? profilePayload.competences : prev.competences,
        notesMoyenne: Number(profilePayload.notesMoyenne ?? prev.notesMoyenne),
        nombreEvaluations: Number(profilePayload.nombreEvaluations ?? prev.nombreEvaluations),
        missionsCompletees: Number(profilePayload.missionsCompletees ?? prev.missionsCompletees),
      }));
      setIsEditing(false);
      toast.success(tr("Informations mises à jour", "Alhabarey taaga", "An sabunta bayanai"));
    } catch (error: any) {
      toast.error(error?.message || tr("Erreur réseau. Vérifiez que le backend est lancé.", "Reso laybu. Guna backend ga dira.", "Kuskuren hanyar sadarwa. Ka tabbata backend na aiki."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard-jeune">
            <Button variant="ghost">
              <ArrowLeft className="size-4 mr-2" />
              {tr("Retour", "Ye banda", "Komawa")}
            </Button>
          </Link>
          <Button onClick={handleToggleEdit} disabled={isSaving}>
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
          <div className="size-24 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <User className="size-12 text-indigo-700" />
          </div>
          <h1 className="text-2xl font-bold">{formData.prenom} {formData.nom}</h1>
          <p className="text-gray-600">{formData.ville}</p>
          <div className="flex items-center gap-1 mt-2">
            <Star className="size-4 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">{profileData.notesMoyenne}/5</span>
            <span className="text-gray-500 text-sm">({profileData.nombreEvaluations} {tr("avis", "bayray", "ra'ayi")})</span>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{tr("Informations personnelles", "Ni alhabarey", "Bayanan mutum")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>{tr("Nom", "Maa", "Suna")}</Label>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nom: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{tr("Prénom", "Maa jine", "Sunan farko")}</Label>
                  <Input
                    value={formData.prenom}
                    onChange={(e) => setFormData((prev) => ({ ...prev, prenom: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>{tr("Email", "Email", "Imel")}</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{tr("Téléphone", "Talon", "Waya")}</Label>
                <Input
                  value={formData.telephone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, telephone: e.target.value }))}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{tr("Ville", "Kwaara", "Gari")}</Label>
                <Input
                  value={formData.ville}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ville: e.target.value }))}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tr("Formation et expérience", "Sambay nda goy hima", "Ilimi da kwarewa")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{tr("Éducation", "Sambay", "Ilimi")}</Label>
                <Input
                  value={profileData.education}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, education: e.target.value }))}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{tr("Expérience", "Goy hima", "Kwarewa")}</Label>
                <Textarea
                  value={profileData.experience}
                  onChange={(e) => setProfileData((prev) => ({ ...prev, experience: e.target.value }))}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tr("Mes compétences", "Ay kokariyey", "Kwarewata")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profileData.competences.map((comp, i) => (
                  <Badge key={i}>{comp}</Badge>
                ))}
              </div>
              {isEditing && (
                <div className="mt-4 flex gap-2">
                  <Input
                    value={newCompetence}
                    onChange={(e) => setNewCompetence(e.target.value)}
                    placeholder={tr("Ajouter une compétence", "Kokari foo tonton", "Kara kwarewa")}
                  />
                  <Button type="button" onClick={addCompetence}>
                    {tr("Ajouter", "Tonton", "Kara")}
                  </Button>
                </div>
              )}
              {isEditing && profileData.competences.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profileData.competences.map((comp, i) => (
                    <Button
                      key={`${comp}-${i}`}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCompetence(comp)}
                    >
                      {tr("Retirer", "Kaa", "Cire")}: {comp}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tr("Statistiques", "Lissaafey", "Kididdiga")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{profileData.missionsCompletees}</p>
                  <p className="text-sm text-gray-600 mt-1">{tr("Missions complétées", "Goyey timmante", "Ayyukan da aka kammala")}</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-indigo-600">{profileData.notesMoyenne}</p>
                  <p className="text-sm text-gray-600 mt-1">{tr("Note moyenne", "Hima talfi", "Matsakaicin maki")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
