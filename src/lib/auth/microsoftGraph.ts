import "server-only";

// OAuth2 (authorization code + refresh) against Microsoft's identity
// platform, scoped to exactly one delegated permission this app needs:
// sending mail as the connected admin's own Outlook/Microsoft 365 mailbox.
// `common` as the tenant segment accepts both personal Microsoft accounts
// (outlook.com) and work/school (Microsoft 365) accounts — the two things
// "je suis sur Outlook" could mean — rather than forcing a choice.
const AUTHORITY = "https://login.microsoftonline.com/common/oauth2/v2.0";
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const SCOPES = "offline_access Mail.Send User.Read";

function getClientCredentials() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("MICROSOFT_CLIENT_ID ou MICROSOFT_CLIENT_SECRET manquant.");
  }
  return { clientId, clientSecret };
}

export function getMicrosoftAuthorizeUrl(redirectUri: string, state: string): string {
  const { clientId } = getClientCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: SCOPES,
    state,
    // Forces the account picker even if the browser has an existing
    // Microsoft session — without this, reconnecting after a disconnect
    // can silently re-use whichever account was last signed in.
    prompt: "select_account",
  });
  return `${AUTHORITY}/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

async function requestToken(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(`${AUTHORITY}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Échec de l'authentification Microsoft (${response.status}): ${text}`);
  }
  return response.json();
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();
  return requestToken(
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      scope: SCOPES,
    })
  );
}

// Microsoft refresh tokens rotate — every refresh can return a *new*
// refresh_token that must be re-stored, or the next refresh attempt fails.
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();
  return requestToken(
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: SCOPES,
    })
  );
}

export async function getConnectedAccountEmail(accessToken: string): Promise<string> {
  const response = await fetch(`${GRAPH_BASE}/me?$select=mail,userPrincipalName`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Impossible de récupérer l'adresse du compte Microsoft connecté.");
  const data = await response.json();
  return data.mail ?? data.userPrincipalName;
}

interface GraphMailAttachment {
  name: string;
  content: string; // base64
  contentType?: string;
}

export async function sendMailAsConnectedUser(
  accessToken: string,
  params: { to: string; toName?: string; subject: string; html: string; attachments?: GraphMailAttachment[] }
): Promise<void> {
  const response = await fetch(`${GRAPH_BASE}/me/sendMail`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        subject: params.subject,
        body: { contentType: "HTML", content: params.html },
        toRecipients: [{ emailAddress: { address: params.to, name: params.toName } }],
        attachments: params.attachments?.map((a) => ({
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: a.name,
          contentBytes: a.content,
          contentType: a.contentType ?? "application/octet-stream",
        })),
      },
      saveToSentItems: true,
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Échec de l'envoi via Microsoft Graph (${response.status}): ${text}`);
  }
}
