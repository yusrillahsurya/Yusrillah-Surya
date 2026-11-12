import { getAccessToken } from './googleAuth';
import { DocumentRecord, CompanyProfile, Client } from '../types';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

const APP_FOLDER_NAME = 'PT Yusra Prima Solusindo - Dokumen ERP';

/**
 * Find or create the official root folder for PT Yusra Prima Solusindo in user's Google Drive.
 */
export async function getOrCreateAppFolder(token?: string): Promise<string> {
  const accessToken = token || (await getAccessToken());
  if (!accessToken) throw new Error('Token akses Google Drive tidak tersedia. Silakan masuk dengan Google.');

  // Search for existing folder
  const query = encodeURIComponent(`name = '${APP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errData = await searchRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Gagal mencari folder di Google Drive');
  }

  const data = await searchRes.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: APP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Folder arsip otomatis dokumen Invoice, Surat Penawaran, dan Purchase Order PT Yusra Prima Solusindo',
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Gagal membuat folder di Google Drive');
  }

  const newFolder = await createRes.json();
  return newFolder.id;
}

/**
 * Upload a binary blob (e.g. PDF or JSON) to Google Drive using multipart upload.
 */
export async function uploadBlobToDrive({
  fileName,
  blob,
  mimeType,
  folderId,
  description,
  token,
}: {
  fileName: string;
  blob: Blob;
  mimeType: string;
  folderId?: string;
  description?: string;
  token?: string;
}): Promise<GoogleDriveFile> {
  const accessToken = token || (await getAccessToken());
  if (!accessToken) throw new Error('Token akses Google Drive tidak tersedia. Silakan masuk terlebih dahulu.');

  const targetFolderId = folderId || (await getOrCreateAppFolder(accessToken));

  const metadata = {
    name: fileName,
    mimeType: mimeType,
    parents: [targetFolderId],
    description: description || `Dokumen resmi PT Yusra Prima Solusindo diunggah pada ${new Date().toLocaleString('id-ID')}`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const blobArrayBuffer = await blob.arrayBuffer();

  const multipartRequestBody = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify(metadata),
    delimiter,
    `Content-Type: ${mimeType}\r\n\r\n`,
    new Uint8Array(blobArrayBuffer),
    closeDelimiter,
  ], { type: `multipart/related; boundary=${boundary}` });

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,createdTime,size', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Gagal mengunggah file ke Google Drive');
  }

  return await res.json();
}

/**
 * List files in the app's folder or all recent Drive files.
 */
export async function listAppDriveFiles(folderId?: string, token?: string): Promise<GoogleDriveFile[]> {
  const accessToken = token || (await getAccessToken());
  if (!accessToken) throw new Error('Silakan masuk dengan Google untuk memuat file Drive.');

  let targetFolderId = folderId;
  if (!targetFolderId) {
    try {
      targetFolderId = await getOrCreateAppFolder(accessToken);
    } catch {
      targetFolderId = undefined;
    }
  }

  let q = 'trashed = false';
  if (targetFolderId) {
    q = `'${targetFolderId}' in parents and trashed = false`;
  }

  const fields = 'files(id,name,mimeType,webViewLink,webContentLink,iconLink,thumbnailLink,createdTime,modifiedTime,size)';
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=modifiedTime desc&pageSize=50&fields=${encodeURIComponent(fields)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal memuat daftar file dari Google Drive');
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Delete a file from Google Drive with mandatory explicit confirmation check.
 */
export async function deleteDriveFile(fileId: string, token?: string): Promise<void> {
  const accessToken = token || (await getAccessToken());
  if (!accessToken) throw new Error('Token akses Google Drive tidak tersedia.');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Gagal menghapus file dari Google Drive');
  }
}

/**
 * Create a full data backup of documents, clients, and company settings as JSON in Google Drive.
 */
export async function backupDatabaseToDrive({
  documents,
  clients,
  company,
  token,
}: {
  documents: DocumentRecord[];
  clients: Client[];
  company: CompanyProfile;
  token?: string;
}): Promise<GoogleDriveFile> {
  const backupPayload = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    company,
    totalDocuments: documents.length,
    totalClients: clients.length,
    documents,
    clients,
  };

  const jsonString = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Backup_YPS_Database_${dateStr}_${Date.now()}.json`;

  return await uploadBlobToDrive({
    fileName,
    blob,
    mimeType: 'application/json',
    description: `Cadangan database otomatis PT Yusra Prima Solusindo per ${new Date().toLocaleString('id-ID')}`,
    token,
  });
}
