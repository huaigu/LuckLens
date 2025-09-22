import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    "frame": {
      "name": "LuckLens",
      "version": "1",
      "iconUrl": "https://cryptofortune.memego.ai/images/icon.png",
      "homeUrl": "https://cryptofortune.memego.ai",
      "buttonTitle": "Draw Fortune",
      "splashImageUrl": "https://cryptofortune.memego.ai/images/splash.png",
      "splashBackgroundColor": "#ffffff",
      "webhookUrl": "https://cryptofortune.memego.ai/api/webhook",
      "subtitle": "Crypto Fortune",
      "description": "draw today's trading fortune and get your own cyber proverb",
      "primaryCategory": "social",
      "tags": [
        "luck",
        "monad",
        "social",
        "nft"
      ]
    },
    "accountAssociation": {
      "header": "eyJmaWQiOjI1MjI5MywidHlwZSI6ImF1dGgiLCJrZXkiOiIweGRlY0E2MjExMGYwOGQ5RDIxN0U5MTlFMDY5QWVkMWFBNDM2YjBkMjYifQ",
      "payload": "eyJkb21haW4iOiJjcnlwdG9mb3J0dW5lLm1lbWVnby5haSJ9",
      "signature": "wOunmrN2ClJNeGPHwxFnIDQH+uVOLgyv1+qVSNGEK4R+70jau3Ndt4K42NrvFTBrPex0A1+WD+IVAIiNkSAy9hw="
    }
  };

  return NextResponse.json(farcasterConfig);
}
