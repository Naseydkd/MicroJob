import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { getAdminUser, getAdminToken, refreshAdminToken } from '../lib/adminAuth';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ChevronLeft, FileText, CheckCircle, XCircle, ExternalLink, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Verification {
  id: string;
  email: string;
  user_type: 'jeune' | 'entreprise';
  nom: string;
  prenom: string | null;
  telephone: string;
  ville: string;
  identity_document_path: string;
  document_url: string | null;
  created_at: string;
  identity_verified?: boolean;
  identity_verified_at?: string;
  status?: 'approved' | 'rejected';
}

export function AdminVerifications() {
  const adminUser = getAdminUser();
  if (!adminUser) return <Navigate to="/admin-login" replace />;

  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [pending, setPending] = useState<Verification[]>([]);
  const [history, setHistory] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    refreshAdminToken().finally(() => loadAll());
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const token = getAdminToken();
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [p, h] = await Promise.all([
        fetch('/admin/pending-verifications', { headers }).then(r => r.json()),
        fetch('/admin/verifications-history', { headers }).then(r => r.json()),
      ]);
      setPending(Array.isArray(p) ? p : []);
      setHistory(Array.isArray(h) ? h : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleVerify = async (userId: string, approved: boolean) => {
    setProcessing(userId);
    const token = getAdminToken();
    try {
      const res = await fetch(`/admin/verify-identity/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      if (!res.ok) throw new Error('Erreur');
      toast.success(approved ? 'Identité approuvée ✓' : 'Vérification rejetée');
      await loadAll();
    } catch { toast.error('Erreur'); }
    finally { setProcessing(null); }
  };

  const DocPreview = ({ v }: { v: Verification }) => (
    v.document_url ? (
      v.identity_document_path?.endsWith('.pdf') ? (
        <a href={v.document_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border transition-colors">
          <FileText className="size-8 text-red-500" />
          <div><p className="font-medium text-sm">Document PDF</p><p className="text-xs text-gray-500">Cliquer pour ouvrir</p></div>
          <ExternalLink className="size-4 text-gray-400 ml-auto" />
        </a>
      ) : (
        <a href={v.document_url} target="_blank" rel="noopener noreferrer">
          <img src={v.document_url} alt="Pièce d'identité" className="w-full max-h-64 object-contain bg-gray-50 rounded-xl border" />
        </a>
      )
    ) : (
      <div className="border rounded-xl p-4 bg-gray-50 text-sm text-gray-500 flex items-center gap-2">
        <FileText className="size-4" /> Document non disponible
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 h-16 flex items-center gap-4 sticky top-0 z-30">
        <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="size-5" /></Link>
        <h1 className="font-semibold text-gray-900">Vérifications d'identité</h1>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Onglets */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'pending' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}>
            <Clock className="size-4" />
            En attente
            {pending.length > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === 'pending' ? 'bg-white/20' : 'bg-red-100 text-red-700'}`}>{pending.length}</span>}
          </button>
          <button onClick={() => setTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'history' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}>
            <CheckCircle className="size-4" />
            Historique
            {history.length > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === 'history' ? 'bg-white/20' : 'bg-gray-100 text-gray-700'}`}>{history.length}</span>}
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Chargement...</p>
        ) : tab === 'pending' ? (
          pending.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <CheckCircle className="size-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500">Aucune vérification en attente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map(v => (
                <Card key={v.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{v.nom} {v.prenom}</h3>
                        <Badge variant={v.user_type === 'jeune' ? 'default' : 'secondary'}>
                          {v.user_type === 'jeune' ? 'Jeune' : 'Entreprise'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 mb-4">
                        <p>📧 {v.email}</p>
                        <p>📱 {v.telephone}</p>
                        <p>📍 {v.ville}</p>
                        <p className="text-xs text-gray-400">Inscrit le {new Date(v.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <DocPreview v={v} />
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button onClick={() => handleVerify(v.id, true)} disabled={processing === v.id}
                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                        <CheckCircle className="size-4" /> Approuver
                      </Button>
                      <Button onClick={() => handleVerify(v.id, false)} disabled={processing === v.id}
                        variant="destructive" className="flex items-center gap-2">
                        <XCircle className="size-4" /> Rejeter
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : (
          history.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <p className="text-gray-500">Aucun historique</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(v => (
                <Card key={v.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`size-9 rounded-full flex items-center justify-center ${v.status === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {v.status === 'approved' ? <CheckCircle className="size-5 text-green-600" /> : <XCircle className="size-5 text-red-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{v.nom} {v.prenom}</p>
                        <p className="text-xs text-gray-500">{v.email}</p>
                        {v.identity_verified_at && (
                          <p className="text-xs text-gray-400">{new Date(v.identity_verified_at).toLocaleDateString('fr-FR')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={v.user_type === 'jeune' ? 'default' : 'secondary'} className="text-xs">
                        {v.user_type === 'jeune' ? 'Jeune' : 'Entreprise'}
                      </Badge>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${v.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {v.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                      </span>
                      {v.document_url && (
                        <a href={v.document_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 hover:bg-gray-100 rounded-lg">
                          <ExternalLink className="size-4 text-gray-500" />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
