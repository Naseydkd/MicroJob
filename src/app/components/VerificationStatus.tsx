import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Alert } from './ui/alert';
import { Badge } from './ui/badge';

interface VerificationStatusProps {
  userId: string;
}

export function VerificationStatus({ userId }: VerificationStatusProps) {
  const [status, setStatus] = useState<{
    identityVerified: boolean;
    identityVerifiedAt: string | null;
    hasDocument: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, [userId]);

  const loadStatus = async () => {
    try {
      const data = await api.get<{
        identityVerified: boolean;
        identityVerifiedAt: string | null;
        hasDocument: boolean;
      }>(`/users/${userId}/verification-status`);
      setStatus(data);
    } catch (error) {
      console.error('Erreur lors du chargement du statut:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  if (!status) {
    return null;
  }

  if (status.identityVerified) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-600">
            ✓ Vérifié
          </Badge>
          <span className="text-sm text-green-800">
            Votre identité a été vérifiée
            {status.identityVerifiedAt && (
              <span className="text-xs text-green-600 ml-2">
                le {new Date(status.identityVerifiedAt).toLocaleDateString('fr-FR')}
              </span>
            )}
          </span>
        </div>
      </Alert>
    );
  }

  if (status.hasDocument) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-yellow-600">
            ⏳ En attente
          </Badge>
          <span className="text-sm text-yellow-800">
            Votre pièce d'identité est en cours de vérification
          </span>
        </div>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <div className="flex items-center gap-2">
        <Badge variant="destructive">
          ⚠ Non vérifié
        </Badge>
        <span className="text-sm">
          Vous devez soumettre une pièce d'identité
        </span>
      </div>
    </Alert>
  );
}
