import { getSupabase } from './supabase';
import { isSupabaseEnabled } from './config';

function extensionFromUri(uri: string) {
  const match = uri.match(/\.(\w+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

function contentTypeFromExtension(ext: string) {
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    default:
      return 'image/jpeg';
  }
}

async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  return response.arrayBuffer();
}

export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  if (!isSupabaseEnabled) return localUri;
  if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
    return localUri;
  }

  const supabase = getSupabase();
  if (!supabase) return localUri;

  const ext = extensionFromUri(localUri);
  const path = `${userId}/avatar.${ext}`;
  const body = await uriToArrayBuffer(localUri);

  const { error } = await supabase.storage.from('avatars').upload(path, body, {
    upsert: true,
    contentType: contentTypeFromExtension(ext),
  });

  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function uploadClubLogo(clubId: string, localUri: string): Promise<string> {
  if (!isSupabaseEnabled) return localUri;

  const supabase = getSupabase();
  if (!supabase) return localUri;

  const ext = extensionFromUri(localUri);
  const path = `${clubId}/logo.${ext}`;
  const body = await uriToArrayBuffer(localUri);

  const { error } = await supabase.storage.from('club-logos').upload(path, body, {
    upsert: true,
    contentType: contentTypeFromExtension(ext),
  });

  if (error) throw error;

  const { data } = supabase.storage.from('club-logos').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
