import QRCode from "qrcode";

export function getTableUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  return `${base}/mesa/${token}`;
}

export async function generateQRDataURL(token: string): Promise<string> {
  return QRCode.toDataURL(getTableUrl(token), {
    width: 300,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

export async function generateQRBuffer(token: string): Promise<Buffer> {
  return QRCode.toBuffer(getTableUrl(token), {
    width: 400,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}
