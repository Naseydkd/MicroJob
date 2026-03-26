import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../lib/i18n";
import { api } from "../lib/api";

const AUTH_USER_KEY = "microjob_auth_user";

type AuthUser = {
  id: string;
  userType: "jeune" | "entreprise";
};

function getAuthUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function PublierMission() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    remuneration: "",
    duree: "",
    lieu: "",
    nombrePostes: "1",
    maxCandidatures: "1",
    dateDebut: "",
  });
  const [competences, setCompetences] = useState<string[]>([]);
  const [newCompetence, setNewCompetence] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addCompetence = () => {
    if (newCompetence.trim() && !competences.includes(newCompetence.trim())) {
      setCompetences([...competences, newCompetence.trim()]);
      setNewCompetence("");
    }
  };

  const removeCompetence = (comp: string) => {
    setCompetences(competences.filter(c => c !== comp));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titre || !formData.description || !formData.remuneration) {
      toast.error(tr("Veuillez remplir tous les champs obligatoires", "Taari tilas kulu cika", "Cika dukkan filayen da ake bukata"));
      return;
    }
    const nombrePostes = Number(formData.nombrePostes || 1);
    const maxCandidatures = Number(formData.maxCandidatures || 1);
    if (!Number.isFinite(nombrePostes) || nombrePostes < 1) {
      toast.error(tr("Le nombre de postes doit être au moins 1", "Nungu adadi ga hima 1", "Yawan gurabe ya zama a kalla 1"));
      return;
    }
    if (!Number.isFinite(maxCandidatures) || maxCandidatures < nombrePostes) {
      toast.error(tr("Le nombre max de candidats doit être supérieur ou égal au nombre de postes", "Naafal max ga hima nungu adadi", "Matsakaicin masu nema ya zama daidai ko fiye da yawan gurabe"));
      return;
    }

    if (competences.length === 0) {
      toast.error(tr("Ajoutez au moins une compétence requise", "Kokari foo ga tilas", "Kara akalla kwarewa daya da ake bukata"));
      return;
    }

    const authUser = getAuthUser();
    const entrepriseId = authUser?.userType === "entreprise" ? authUser.id : "";
    if (!entrepriseId) {
      toast.error(tr("Session entreprise invalide. Reconnectez-vous.", "Kompani session laala. Huru taaga.", "Zaman kamfani ya lalace. Sake shiga."));
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/missions", {
        entrepriseId,
        titre: formData.titre.trim(),
        description: formData.description.trim(),
        remuneration: Number(formData.remuneration),
        duree: formData.duree.trim(),
        lieu: formData.lieu.trim(),
        nombrePostes,
        maxCandidatures,
        dateDebut: formData.dateDebut || null,
        competencesRequises: competences,
        statut: "ouverte",
      });

      toast.success(tr("Mission publiée avec succès !", "Goy cebandi nda boryo!", "An wallafa aikin cikin nasara!"));
      navigate("/dashboard-entreprise");
    } catch (error: any) {
      toast.error(error?.message || tr("Impossible de publier la mission", "Goy cebbayan mana", "Ba a iya wallafa aikin ba"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link to="/dashboard-entreprise">
            <Button variant="ghost">
              <ArrowLeft className="size-4 mr-2" />
              {tr("Retour", "Ye banda", "Komawa")}
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">{tr("Publier une nouvelle mission", "Goy taaga cebbey", "Wallafa sabon aiki")}</h1>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{tr("Informations de base", "Alhabari sintin", "Bayanan asali")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="titre">{tr("Titre de la mission *", "Goy maa *", "Taken aiki *")}</Label>
                  <Input
                    id="titre"
                    placeholder={tr("Ex: Saisie de données clients", "Misal: klantaney data huru", "Misali: Shigar da bayanan kwastomomi")}
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">{tr("Description détaillée *", "Bayray faala *", "Cikakken bayani *")}</Label>
                  <Textarea
                    id="description"
                    placeholder={tr("Décrivez la mission, les tâches à réaliser, etc.", "Goy bayandi nda teegoyey...", "Bayyana aikin da ayyukan da za a yi...")}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 min-h-32"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="remuneration">{tr("Rémunération (FCFA) *", "Banni (FCFA) *", "Albashi (FCFA) *")}</Label>
                    <Input
                      id="remuneration"
                      type="number"
                      placeholder="25000"
                      value={formData.remuneration}
                      onChange={(e) => setFormData({ ...formData, remuneration: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="duree">{tr("Durée", "Waati", "Tsawon lokaci")}</Label>
                    <Input
                      id="duree"
                      placeholder={tr("Ex: 3 jours, 1 semaine", "Misal: zaaro 3, habu 1", "Misali: kwanaki 3, mako 1")}
                      value={formData.duree}
                      onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lieu">{tr("Lieu", "Nungu", "Wuri")}</Label>
                    <Input
                      id="lieu"
                      placeholder="Niamey - Plateau"
                      value={formData.lieu}
                      onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postes">{tr("Nombre de postes", "Nungu adadi", "Yawan gurabe")}</Label>
                    <Input
                      id="postes"
                      type="number"
                      min="1"
                      value={formData.nombrePostes}
                      onChange={(e) => setFormData({ ...formData, nombrePostes: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="max-candidatures">{tr("Max candidatures", "Naafal max", "Matsakaicin masu nema")}</Label>
                    <Input
                      id="max-candidatures"
                      type="number"
                      min="1"
                      value={formData.maxCandidatures}
                      onChange={(e) => setFormData({ ...formData, maxCandidatures: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dateDebut">{tr("Date de début", "Sintin han", "Ranar farawa")}</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tr("Compétences requises", "Kokariyey ga tilas", "Kwarewar da ake bukata")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {competences.map((comp, i) => (
                    <Badge key={i} className="pl-3 pr-1 py-1.5">
                      {comp}
                      <button
                        type="button"
                        onClick={() => removeCompetence(comp)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder={tr("Ajouter une compétence...", "Kokari foo tonton...", "Kara kwarewa...")}
                    value={newCompetence}
                    onChange={(e) => setNewCompetence(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCompetence();
                      }
                    }}
                  />
                  <Button type="button" onClick={addCompetence} size="icon">
                    <Plus className="size-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  {tr("Ajoutez les compétences nécessaires pour cette mission", "Kokariyey tonton goy woo se", "Kara kwarewar da ake bukata don wannan aiki")}
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Link to="/dashboard-entreprise" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  {tr("Annuler", "Naŋ", "Soke")}
                </Button>
              </Link>
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                {isSubmitting ? tr("Publication...", "Cebbandi...", "Ana wallafawa...") : tr("Publier la mission", "Goy cebbey", "Wallafa aiki")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
