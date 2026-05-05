const DEFAULT_AI_MODEL = "claude-opus-4-6";

export type ServerEnv = {
  aiKey: string;
  aiModel: string;
};

export type SheetsEnv = {
  googleSheetId: string;
  googlePrivateKey: string;
  googleClientEmail: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, "\n");
}

export function getServerEnv(): ServerEnv {
  const aiKey = requiredEnv("AI_KEY");
  const aiModel = process.env.AI_MODEL?.trim() || DEFAULT_AI_MODEL;

  return {
    aiKey,
    aiModel,
  };
}

export function getSheetsEnv(): SheetsEnv {
  return {
    googleSheetId: requiredEnv("GOOGLE_SHEET_ID"),
    googlePrivateKey: normalizePrivateKey(requiredEnv("GOOGLE_PRIVATE_KEY")),
    googleClientEmail: requiredEnv("GOOGLE_CLIENT_EMAIL"),
  };
}
