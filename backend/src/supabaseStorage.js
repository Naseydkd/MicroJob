const { createClient } = require('@supabase/supabase-js');
// Ne pas recharger dotenv ici - déjà chargé par index.js

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const BUCKET = 'identity-documents';

/**
 * Upload un fichier vers Supabase Storage
 * @param {Buffer} buffer - Contenu du fichier
 * @param {string} filename - Nom du fichier
 * @param {string} mimetype - Type MIME
 * @returns {Promise<string>} URL publique du fichier
 */
async function uploadToStorage(buffer, filename, mimetype) {
  const path = `${Date.now()}-${filename}`;
  
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  // Retourner le chemin (pas l'URL publique car le bucket est privé)
  return data.path;
}

/**
 * Générer une URL signée temporaire pour accéder au fichier
 * @param {string} path - Chemin du fichier dans le bucket
 * @param {number} expiresIn - Durée en secondes (défaut: 1h)
 */
async function getSignedUrl(path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
}

/**
 * Supprimer un fichier du storage
 */
async function deleteFromStorage(path) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);
  if (error) console.error('Delete failed:', error.message);
}

module.exports = { uploadToStorage, getSignedUrl, deleteFromStorage, BUCKET };
