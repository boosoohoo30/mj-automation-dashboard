import { getDb } from '../db/client.js';

const CONFLUENCE_URL = process.env.CONFLUENCE_URL || '';
const CONFLUENCE_EMAIL = process.env.CONFLUENCE_EMAIL || '';
const CONFLUENCE_TOKEN = process.env.CONFLUENCE_TOKEN || '';

function getAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${CONFLUENCE_EMAIL}:${CONFLUENCE_TOKEN}`).toString('base64');
}

export interface ConceptData {
  title: string;
  body: string;
  url: string;
}

// Fetch a Confluence page by ID or URL
export async function fetchConceptPage(pageIdOrUrl: string): Promise<ConceptData> {
  // Extract page ID from URL if needed
  let pageId = pageIdOrUrl;
  const urlMatch = pageIdOrUrl.match(/\/pages\/(\d+)/);
  if (urlMatch) {
    pageId = urlMatch[1];
  }

  const apiUrl = `${CONFLUENCE_URL}/wiki/api/v2/pages/${pageId}?body-format=storage`;

  const res = await fetch(apiUrl, {
    headers: {
      Authorization: getAuthHeader(),
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Confluence API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  return {
    title: data.title,
    body: data.body?.storage?.value || '',
    url: `${CONFLUENCE_URL}/wiki/spaces/${data.spaceId}/pages/${data.id}`,
  };
}

// Upload an image as attachment to a Confluence page
export async function uploadToConfluence(pageId: string, filePath: string, filename: string): Promise<string> {
  const fs = await import('fs');
  const path = await import('path');

  const fileBuffer = fs.readFileSync(filePath);
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer]), filename);

  const apiUrl = `${CONFLUENCE_URL}/wiki/rest/api/content/${pageId}/child/attachment`;

  const res = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: getAuthHeader(),
      'X-Atlassian-Token': 'nocheck',
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Confluence upload error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const attachmentUrl = `${CONFLUENCE_URL}${data.results?.[0]?._links?.download || ''}`;
  return attachmentUrl;
}
