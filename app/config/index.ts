
const getEnvironment = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`process.env.${key} is required.`);
  return value;
};

const config = {
  apiKey: getEnvironment('API_KEY'),
  apiKeySecret: getEnvironment('API_KEY_SECRET'),
  callbackUrl: getEnvironment('CALLBACK_URL'),
  bucket: getEnvironment('BUCKET'),
  apiBathPath: getEnvironment('API_BASE_PATH'),
};

export default config;
