import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface PendingVerification {
  id: string;
  email: string;
  user_type: 'jeune' | 'entreprise';
  nom: string;
  prenom: string | null;
  telephone: string;
  ville: string;
  identity_document_path: string;
  created_at: string;
}

export function AdminVerifications() {
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      const data = await api.get<PendingVerification[]>('/admin/pending-verifications');
      setVerifications(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: string, approved: boolean) => {
    setProcessing(userId);
    try {
      await api.post(`/admin/verify-identity/${userId}`, { approved });
      alert(approved ? 'Identité approuvée' : 'Vérification rejetée');
      await loadVerifications();
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la vérification');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Vérifications d'identité en attente</h1>

      {verifications.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          Aucune vérification en attente
        </Card>
      ) : (
        <div className="space-y-4">
          {verifications.map((verification) => (
            <Card key={verification.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold">
                      {verification.nom} {verification.prenom}
                    </h3>
                    <Badge variant={verification.user_type === 'jeune' ? 'default' : 'secondary'}>
                      {verification.user_type === 'jeune' ? 'Jeune' : 'Entreprise'}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📧 {verification.email}</p>
                    <p>📱 {verification.telephone}</p>
                    <p>📍 {verification.ville}</p>
                    <p className="text-xs text-gray-400">
                      Inscrit le {new Date(verification.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  <div className="mt-4">
                    <a
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/${verification.identity_document_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      📄 Voir la pièce d'identité
                    </a>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleVerify(verification.id, true)}
                    disabled={processing === verification.id}
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    ✓ Approuver
                  </Button>
                  <Button
                    onClick={() => handleVerify(verification.id, false)}
                    disabled={processing === verification.id}
                    variant="destructive"
                  >
                    ✗ Rejeter
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
