import QRCode from "qrcode";

export async function makeQR(
  data: string,
  opts: { dark?: string; light?: string; width?: number } = {},
): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: opts.width ?? 320,
    color: {
      dark: opts.dark ?? "#06070B",
      light: opts.light ?? "#FFFFFF",
    },
  });
}
