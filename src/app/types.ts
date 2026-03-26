// Types pour Microjob
export type UserType = "jeune" | "entreprise" | "admin";
export type ApplicationStatus = "en_attente" | "acceptée" | "refusée";
export type MissionStatus = "ouverte" | "en_cours" | "terminée" | "annulée";

export interface User {
  id: string;
  email: string;
  userType: UserType;
  nom: string;
  prenom?: string;
  telephone: string;
  ville: string;
  createdAt: string;
}

export interface JeuneProfile {
  userId: string;
  dateNaissance: string;
  age: number;
  competences: string[];
  experience: string;
  education: string;
  cv?: string;
  photo?: string;
  notesMoyenne: number;
  nombreEvaluations: number;
  missionsCompletees: number;
}

export interface EntrepriseProfile {
  userId: string;
  nomEntreprise: string;
  secteurActivite: string;
  description: string;
  adresse: string;
  siteWeb?: string;
  logo?: string;
  notesMoyenne: number;
  nombreEvaluations: number;
  missionsPubliees: number;
}

export interface Mission {
  id: string;
  entrepriseId: string;
  entrepriseNom: string;
  entrepriseLogo?: string;
  titre: string;
  description: string;
  competencesRequises: string[];
  remuneration: number;
  duree: string;
  dateDebut: string;
  dateFin?: string;
  lieu: string;
  nombrePostes: number;
  maxCandidatures: number;
  statut: MissionStatus;
  candidaturesCount: number;
  createdAt: string;
}

export interface Candidature {
  id: string;
  missionId: string;
  mission?: Mission;
  jeuneId: string;
  jeuneNom: string;
  jeunePrenom: string;
  jeunePhoto?: string;
  jeuneNote: number;
  lettreMotivation: string;
  statut: ApplicationStatus;
  motifRefus?: string;
  datePostulation: string;
  dateReponse?: string;
}

export interface Evaluation {
  id: string;
  missionId: string;
  evaluateurId: string;
  evaluateurNom: string;
  evalueId: string;
  note: number;
  commentaire: string;
  dateEvaluation: string;
}

export interface Notification {
  id: string;
  userId: string;
  titre: string;
  message: string;
  type: "candidature" | "acceptation" | "refus" | "evaluation" | "mission";
  lu: boolean;
  createdAt: string;
}
