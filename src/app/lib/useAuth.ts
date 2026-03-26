import { useState, useEffect } from 'react';
import { getAuthUser, saveAuthUser, clearAuthUser, AuthUser } from './auth';
import { api } from './api';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getAuthUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getAuthUser();
    setUser(currentUser);
  }, []);

  const login = async (email: string, password: string, userType: 'jeune' | 'entreprise') => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<{
        userId: string;
        email: string;
        userType: 'jeune' | 'entreprise';
        nom: string;
        prenom: string | null;
        telephone: string;
        ville: string;
        accessToken: string;
      }>('/auth/login', { email, password, userType });

      const authUser: AuthUser = {
        id: response.userId,
        email: response.email,
        userType: response.userType,
        nom: response.nom,
        prenom: response.prenom,
        telephone: response.telephone,
        ville: response.ville,
      };

      saveAuthUser(authUser, response.accessToken);
      setUser(authUser);
      return authUser;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur de connexion';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: {
    email: string;
    password: string;
    userType: 'jeune' | 'entreprise';
    nom?: string;
    prenom?: string;
    nomEntreprise?: string;
    telephone: string;
    ville: string;
    identityDocument: File;
  }) => {
    setLoading(true);
    setError(null);
    try {
      // Créer FormData pour l'upload de fichier
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('userType', data.userType);
      formData.append('telephone', data.telephone);
      formData.append('ville', data.ville);
      
      if (data.nom) formData.append('nom', data.nom);
      if (data.prenom) formData.append('prenom', data.prenom);
      if (data.nomEntreprise) formData.append('nomEntreprise', data.nomEntreprise);
      
      formData.append('identityDocument', data.identityDocument);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/signup`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Une erreur est survenue' }));
        throw new Error(error.error || 'Une erreur est survenue');
      }

      const result = await response.json();

      const authUser: AuthUser = {
        id: result.userId,
        email: result.email,
        userType: result.userType,
        nom: result.nom,
        prenom: result.prenom,
        telephone: result.telephone,
        ville: result.ville,
      };

      saveAuthUser(authUser, result.accessToken);
      setUser(authUser);
      return authUser;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'inscription';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthUser();
    setUser(null);
  };

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };
}
