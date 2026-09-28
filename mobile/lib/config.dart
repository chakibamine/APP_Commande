/// Surchargée au build : `--dart-define=API_BASE_URL=https://serveur/api`.
/// Par défaut, adresse du PC sur le Wi-Fi (`localhost` sur le téléphone désigne le téléphone).
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://192.168.1.2:3000/api',
);
