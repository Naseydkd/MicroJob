import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert } from './ui/alert';

interface IdentityDocumentUploadProps {
  onFileSelect: (file: File) => void;
  required?: boolean;
}

export function IdentityDocumentUpload({ onFileSelect, required = true }: IdentityDocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    // Validation du type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format non autorisé');
      return;
    }

    // Validation de la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 5MB)');
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);

    // Créer un aperçu pour les images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">
          Pièce d'identité {required && <span className="text-red-500">*</span>}
        </label>
        <p className="text-xs text-gray-600 mb-2">
        Carte d'identité, carte scolaire, passeport, permis de conduire etc
        </p>
        <Input
          type="file"
          accept="image/jpeg,image/jpg,image/png,application/pdf"
          onChange={handleFileChange}
          required={required}
          className="cursor-pointer text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          JPG, PNG ou PDF • Max 5MB
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {selectedFile && (
        <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
          <p className="font-medium text-green-800">✓ {selectedFile.name}</p>
        </div>
      )}

      {preview && (
        <div className="border rounded overflow-hidden">
          <img
            src={preview}
            alt="Aperçu"
            className="max-w-full h-auto max-h-32 mx-auto"
          />
        </div>
      )}
      
      <p className="text-xs text-gray-500 italic">
        Votre document sera vérifié sous 48h pour garantir la sécurité de tous
      </p>
    </div>
  );
}
