const fs = require('node:fs');
const { parseEnv: parse } = require('node:util');

function readApiUrl(filename) {
  if (!fs.existsSync(filename)) throw new Error('Crie .env.testflight a partir de .env.testflight.example e informe a URL externa da API.');
  const value = parse(fs.readFileSync(filename, 'utf8')).EXPO_PUBLIC_API_URL?.trim();
  if (!value) throw new Error('Preencha EXPO_PUBLIC_API_URL no arquivo .env.testflight antes de gerar o Archive.');
  let url;
  try { url = new URL(value); } catch { throw new Error('EXPO_PUBLIC_API_URL deve ser uma URL HTTPS válida com /api/v1.'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !/^\/api\/v1\/?$/.test(url.pathname)
      || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host === '[::1]'
      || /^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) {
    throw new Error('Use a URL HTTPS externa da API, terminando em /api/v1, sem credenciais, parâmetros ou endereço local.');
  }
  return value.replace(/\/$/, '');
}
module.exports = { readApiUrl };
if (require.main === module) {
  try { process.stdout.write(readApiUrl(process.argv[2])); }
  catch (error) { process.stderr.write(`error: ${error.message}\n`); process.exitCode = 1; }
}
