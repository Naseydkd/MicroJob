import { supabase } from './supabaseClient';
import { Mission, Candidature, User, JeuneProfile, EntrepriseProfile, Evaluation, Notification } from '../app/types';

// Authentication
export const signIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string, userType: User['userType']) => {
  // after creating the user we may want to insert a row in "profiles" table
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
};

export const signOut = async () => supabase.auth.signOut();

// Generic helpers
function handleError<T>(result: { data: T | null; error: any }) {
  if (result.error) throw result.error;
  return result.data as T;
}

// Missions
export const fetchMissions = async (): Promise<Mission[]> => {
  const response = await supabase.from<Mission>('missions').select('*');
  return handleError(response);
};

export const fetchMissionById = async (id: string): Promise<Mission | null> => {
  const response = await supabase.from<Mission>('missions').select('*').eq('id', id).single();
  return handleError(response);
};

// Jeune profile
export const fetchJeuneProfile = async (userId: string): Promise<JeuneProfile | null> => {
  const response = await supabase.from<JeuneProfile>('jeune_profiles').select('*').eq('user_id', userId).single();
  return handleError(response);
};

// Entreprise profile
export const fetchEntrepriseProfile = async (userId: string): Promise<EntrepriseProfile | null> => {
  const response = await supabase.from<EntrepriseProfile>('entreprise_profiles').select('*').eq('user_id', userId).single();
  return handleError(response);
};

// Applications / candidatures
export const fetchCandidaturesForJeune = async (jeuneId: string): Promise<Candidature[]> => {
  const response = await supabase.from<Candidature>('candidatures').select('*').eq('jeune_id', jeuneId);
  return handleError(response);
};

export const applyToMission = async (c: Omit<Candidature, 'id' | 'datePostulation' | 'statut'>) => {
  const response = await supabase.from<Candidature>('candidatures').insert([c]);
  return handleError(response);
};

// Notifications
export const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  const response = await supabase.from<Notification>('notifications').select('*').eq('user_id', userId);
  return handleError(response);
};

// Evaluations
export const fetchEvaluationsForUser = async (userId: string): Promise<Evaluation[]> => {
  const response = await supabase.from<Evaluation>('evaluations').select('*').eq('evalue_id', userId);
  return handleError(response);
};

// Users
export const fetchUserById = async (id: string): Promise<User | null> => {
  const response = await supabase.from<User>('users').select('*').eq('id', id).single();
  return handleError(response);
};
