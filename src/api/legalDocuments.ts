export type LegalDocument = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  content_format: 'plain_text';
  version: number;
  published_at: string;
  url: string;
  version_url: string;
};
export type LegalDocumentSummary = Omit<LegalDocument, 'content'>;

// Public content: never send the user's token to retrieve these documents.
export async function fetchLegalDocuments(slug?: string, version?: string): Promise<LegalDocument | LegalDocumentSummary[]> {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) throw new Error('Os documentos estarão disponíveis quando a conexão com a API for configurada.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${base}/legal-documents${slug ? `/${encodeURIComponent(slug)}${version ? `/versions/${encodeURIComponent(version)}` : ''}` : ''}`, {
      headers: { Accept: 'application/json' }, signal: controller.signal,
    });
    if (response.status === 404) throw new Error('Este documento ainda não foi publicado.');
    if (!response.ok) throw new Error('Não foi possível carregar o documento. Tente novamente.');
    return (await response.json()).data;
  } finally { clearTimeout(timer); }
}
