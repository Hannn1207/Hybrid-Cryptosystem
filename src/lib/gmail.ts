/**
 * Gmail API helper — kirim email dengan lampiran menggunakan OAuth2 access token.
 * Tidak memerlukan app password karena menggunakan token yang sudah ada dari login Google.
 */

interface SendEmailOptions {
  accessToken: string;     // Google OAuth2 access token dari session
  to: string;              // Alamat tujuan
  from: string;            // Alamat pengirim (harus sama dengan akun Google yang login)
  subject: string;
  bodyHtml: string;
  attachment?: {
    filename: string;
    content: string;       // base64-encoded content
    mimeType: string;
  };
}

/**
 * Encode string ke base64url (format yang dipakai Gmail API)
 */
function toBase64Url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Bangun raw RFC 2822 email message dengan MIME multipart
 */
function buildRawEmail(opts: SendEmailOptions): string {
  const boundary = `boundary_${Date.now()}_hybridcrypto`;

  const lines: string[] = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    opts.bodyHtml,
    ``,
  ];

  if (opts.attachment) {
    lines.push(
      `--${boundary}`,
      `Content-Type: ${opts.attachment.mimeType}; name="${opts.attachment.filename}"`,
      `Content-Disposition: attachment; filename="${opts.attachment.filename}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      // Split base64 into 76-char lines (RFC 2045)
      opts.attachment.content.match(/.{1,76}/g)?.join("\n") ?? opts.attachment.content,
      ``
    );
  }

  lines.push(`--${boundary}--`);

  return toBase64Url(lines.join("\n"));
}

/**
 * Kirim email via Gmail API menggunakan OAuth2 access token
 */
export async function sendEmailViaGmail(opts: SendEmailOptions): Promise<void> {
  const raw = buildRawEmail(opts);

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
      (error as { error?: { message?: string } })?.error?.message ??
      `Gmail API error ${response.status}`;
    throw new Error(message);
  }
}

/**
 * Buat HTML body email untuk pengiriman file terenkripsi
 */
export function buildEmailBody(opts: {
  senderName: string;
  recipientEmail: string;
  fileName: string;
  originalSize: number;
  algorithm: string;
  encryptedAt: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:32px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:14px;padding:12px;margin-bottom:16px;">
                <span style="font-size:32px;">🔒</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">HybridCrypto</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;font-family:monospace;">
                AES-256-CBC &nbsp;+&nbsp; RSA-2048-OAEP
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:14px;">Kepada,</p>
              <p style="margin:0 0 24px;color:#f1f5f9;font-size:16px;font-weight:600;">${opts.recipientEmail}</p>

              <p style="margin:0 0 20px;color:#cbd5e1;font-size:15px;line-height:1.6;">
                <strong style="color:#f1f5f9;">${opts.senderName}</strong> telah mengirimkan sebuah
                dokumen terenkripsi kepada Anda melalui <strong style="color:#60a5fa;">HybridCrypto</strong>.
              </p>

              <!-- File Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#0f172a;border:1px solid #334155;border-radius:12px;margin:0 0 24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 14px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                      Detail File
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:13px;font-family:monospace;width:140px;">Nama file</td>
                        <td style="padding:6px 0;color:#e2e8f0;font-size:13px;font-family:monospace;">${opts.fileName}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:13px;font-family:monospace;">Algoritma</td>
                        <td style="padding:6px 0;color:#60a5fa;font-size:13px;font-family:monospace;">${opts.algorithm}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:13px;font-family:monospace;">Ukuran asli</td>
                        <td style="padding:6px 0;color:#e2e8f0;font-size:13px;font-family:monospace;">${Math.round(opts.originalSize / 1024)} KB</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#64748b;font-size:13px;font-family:monospace;">Dienkripsi</td>
                        <td style="padding:6px 0;color:#e2e8f0;font-size:13px;font-family:monospace;">${opts.encryptedAt}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Info dekripsi -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#1e3a5f;border:1px solid #1d4ed8;border-radius:12px;margin:0 0 24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px;color:#93c5fd;font-size:13px;font-weight:600;">ℹ️ Cara Membuka File</p>
                    <p style="margin:0;color:#bfdbfe;font-size:13px;line-height:1.6;">
                      File terlampir (<code style="background:#1d4ed8;padding:1px 5px;border-radius:4px;">.encrypted</code>)
                      hanya bisa dibuka di aplikasi <strong>HybridCrypto</strong> menggunakan
                      RSA private key yang sesuai. Login ke aplikasi → Halaman Dekripsi → pilih dokumen.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                Jika Anda tidak mengenal pengirim ini, abaikan email ini.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:20px 32px;border-top:1px solid #1e293b;text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">
                Dikirim via <strong style="color:#60a5fa;">HybridCrypto</strong> &mdash;
                Implementasi AES-256 + RSA-2048 &mdash; Tugas UAS Kriptografi
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
