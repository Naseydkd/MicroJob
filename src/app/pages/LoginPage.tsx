import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Briefcase, Users, Building2, Mail, Lock, Eye, EyeOff, User, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../lib/i18n";
import { IdentityDocumentUpload } from "../components/IdentityDocumentUpload";
import { PhoneInput } from "../components/PhoneInput";

type AuthUserType = "jeune" | "entreprise";
const AUTH_USER_KEY = "microjob_auth_user";

export function LoginPage() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<AuthUserType>("jeune");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [telephone, setTelephone] = useState("");
  const [ville, setVille] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [identityDocument, setIdentityDocument] = useState<File | null>(null);

  const saveAuthUser = (payload: any) => {
    const authUser = {
      id: payload?.userId ?? null,
      email: payload?.email ?? email.trim().toLowerCase(),
      userType: payload?.userType ?? userType,
      nom: payload?.nom ?? null,
      prenom: payload?.prenom ?? null,
      telephone: payload?.telephone ?? null,
      ville: payload?.ville ?? null,
    };
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(tr("Veuillez remplir tous les champs", "Taari kulu cika", "Cika dukkan filaye"));
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          userType,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload?.error || tr("Impossible de se connecter", "Huru mana hin ka tee", "Ba a iya shiga ba"));
        return;
      }

      saveAuthUser(payload);
      localStorage.setItem('access_token', payload.token);
      toast.success(tr("Connexion réussie !", "Huru te boryo!", "An shiga lafiya!"));
      if (payload.userType === "admin") {
        navigate("/admin");
      } else if (userType === "jeune") {
        navigate("/dashboard-jeune");
      } else {
        navigate("/dashboard-entreprise");
      }
    } catch {
      toast.error(tr("Erreur réseau. Vérifiez que le backend est lancé.", "Reso laybu. Guna backend ga dira.", "Kuskuren hanyar sadarwa. Ka tabbata backend na aiki."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      toast.error(tr("Veuillez remplir tous les champs", "Taari kulu cika", "Cika dukkan filaye"));
      return;
    }

    if (password.length < 8) {
      toast.error(tr("Le mot de passe doit contenir au moins 8 caractères", "Kufal kalima ga hima harfu 8", "Kalmar sirri ta zama a kalla haruffa 8"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(tr("Les mots de passe ne correspondent pas", "Kufal kalimey si hima", "Kalmomin sirri ba su yi daidai ba"));
      return;
    }
    if (userType === "jeune" && (!nom || !prenom)) {
      toast.error(tr("Nom et prénom sont obligatoires pour un compte jeune", "Ma da maa jine ga tilas zanka compte se", "Suna da suna na farko dole ne ga asusun matashi"));
      return;
    }
    if (userType === "entreprise" && !nomEntreprise) {
      toast.error(tr("Le nom de l'entreprise est obligatoire", "Kompani maa ga tilas", "Sunan kamfani dole ne"));
      return;
    }
    if (!telephone || !ville) {
      toast.error(tr("Téléphone et ville sont obligatoires", "Talon da kwaara ga tilas", "Lambar waya da gari dole ne"));
      return;
    }
    if (!identityDocument) {
      toast.error(tr("La pièce d'identité est obligatoire", "Karta ga tilas", "Katin shaida dole ne"));
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Créer FormData pour l'upload de fichier
      const formData = new FormData();
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      formData.append('userType', userType);
      formData.append('nom', nom.trim());
      formData.append('prenom', prenom.trim());
      formData.append('nomEntreprise', nomEntreprise.trim());
      formData.append('telephone', telephone.trim());
      formData.append('ville', ville.trim());
      formData.append('identityDocument', identityDocument);

      const response = await fetch("/auth/signup", {
        method: "POST",
        body: formData, // Pas de Content-Type header, le navigateur le gère automatiquement
      });

      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload?.error || tr("Impossible de créer le compte", "Compte teeyan mana hin ka tee", "Ba a iya kirkirar asusu ba"));
        return;
      }

      saveAuthUser(payload);
      toast.success(tr("Inscription réussie !", "Huru teeyan boryo!", "Rajista ta yi nasara!"));
      if (userType === "jeune") {
        navigate("/dashboard-jeune");
      } else {
        navigate("/dashboard-entreprise");
      }
    } catch {
      toast.error(tr("Erreur réseau. Vérifiez que le backend est lancé.", "Reso laybu. Guna backend ga dira.", "Kuskuren hanyar sadarwa. Ka tabbata backend na aiki."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="size-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center">
            <Briefcase className="size-7 text-white" />
          </div>
          <span className="font-bold text-2xl">Microjob</span>
        </Link>

        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {authMode === "login"
                ? tr("Bienvenue !", "Fo nda hani!", "Barka da zuwa!")
                : tr("Créer un compte", "Teeyan compte", "Kirkiri asusu")}
            </CardTitle>
            <CardDescription>
              {authMode === "login"
                ? tr("Connectez-vous pour accéder à votre espace", "Huru ka ni faaru du", "Shiga domin samun yankinka")
                : tr("Inscrivez-vous pour accéder à votre espace", "Teeyan ka ni faaru du", "Yi rajista domin samun yankinka")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={userType} onValueChange={(v) => setUserType(v as AuthUserType)} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="jeune" className="flex items-center gap-2">
                  <Users className="size-4" />
                  {tr("Jeune", "Zanka", "Matashi")}
                </TabsTrigger>
                <TabsTrigger value="entreprise" className="flex items-center gap-2">
                  <Building2 className="size-4" />
                  {tr("Entreprise", "Kompani", "Kamfani")}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={authMode === "login" ? handleLogin : handleSignup} className="space-y-4">
              {authMode === "signup" && userType === "jeune" && (
                <>
                  <div>
                    <Label htmlFor="nom">{tr("Nom", "Maa", "Suna")}</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="nom"
                        placeholder={tr("Votre nom", "Ni maa", "Sunanka")}
                        className="pl-10"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="prenom">{tr("Prénom", "Maa jine", "Sunan farko")}</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="prenom"
                        placeholder={tr("Votre prénom", "Ni maa jine", "Sunan farkonka")}
                        className="pl-10"
                        value={prenom}
                        onChange={(e) => setPrenom(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {authMode === "signup" && userType === "entreprise" && (
                <div>
                  <Label htmlFor="nomEntreprise">{tr("Nom de l'entreprise", "Kompani maa", "Sunan kamfani")}</Label>
                  <div className="relative mt-1">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="nomEntreprise"
                      placeholder={tr("Nom de votre entreprise", "Ni kompani maa", "Sunan kamfaninka")}
                      className="pl-10"
                      value={nomEntreprise}
                      onChange={(e) => setNomEntreprise(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {authMode === "signup" && (
                <>
                  <div>
                    <Label htmlFor="telephone">{tr("Téléphone", "Talon", "Waya")}</Label>
                    <div className="mt-1">
                      <PhoneInput
                        value={telephone}
                        onChange={setTelephone}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ville">{tr("Ville", "Kwaara", "Gari")}</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="ville"
                        placeholder={tr("Niamey", "Niamey", "Niamey")}
                        className="pl-10"
                        value={ville}
                        onChange={(e) => setVille(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email">{tr("Email", "Email", "Imel")}</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={userType === "jeune" ? "exemple@gmail.com" : "exemple@gmail.com"}
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">{tr("Mot de passe", "Kufal kalima", "Kalmar sirri")}</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {authMode === "signup" && (
                <div>
                  <Label htmlFor="confirmPassword">{tr("Confirmer le mot de passe", "Kufal kalima tabbatandi", "Tabbatar da kalmar sirri")}</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {authMode === "signup" && (
                <IdentityDocumentUpload 
                  onFileSelect={setIdentityDocument}
                  required={true}
                />
              )}

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full ${
                  userType === "jeune" 
                    ? "bg-indigo-600 hover:bg-indigo-700" 
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isSubmitting
                  ? tr("Veuillez patienter...", "Wa batu kayna...", "Dan jira...")
                  : authMode === "login"
                    ? tr("Se connecter", "Huru", "Shiga")
                    : tr("S'inscrire", "Teeyan", "Yi rajista")}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                {authMode === "login"
                  ? tr("Pas encore de compte ? ", "Compte sinda? ", "Ba ka da asusu tukuna? ")
                  : tr("Déjà un compte ? ", "Compte bara? ", "Kana da asusu tuni? ")}
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                  className="text-indigo-600 hover:underline font-medium"
                >
                  {authMode === "login" ? tr("S'inscrire", "Teeyan", "Yi rajista") : tr("Se connecter", "Huru", "Shiga")}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            {tr("← Retour à l'accueil", "← Ye kate do", "← Komawa gida")}
          </Link>
        </div>
      </div>
    </div>
  );
}
