import https from 'https';

const MCP_URL = 'https://mcp.supabase.com/mcp?project_ref=vbpunolnqikllwanfvxi';
const PERSONAL_TOKEN = 'sbp_7cce29652e2b044d6a7000c741b4fb388bfb14d5';
let sessionId = null;

function mcpRequest(method, params = {}, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params });
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${PERSONAL_TOKEN}`,
      'Content-Length': Buffer.byteLength(body),
      ...extraHeaders
    };
    const req = https.request(MCP_URL, { method: 'POST', headers }, (res) => {
      const sid = res.headers['mcp-session-id'];
      if (sid && !sessionId) sessionId = sid;
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { resolve(data); });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  await mcpRequest('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'check-auth', version: '1.0' } });
  await mcpRequest('notifications/initialized', {});
  const h = { 'Mcp-Session-Id': sessionId };

  console.log('🔍 Verificando usuários no Auth vs public.users...\n');

  const result = await mcpRequest('tools/call', {
    name: 'execute_sql',
    arguments: {
      query: `
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.user_uuid,
    au.email AS auth_email,
    au.created_at AS auth_created,
    CASE WHEN au.id IS NOT NULL THEN '✅ No Auth' ELSE '❌ SEM Auth' END AS auth_status
FROM public.users u
LEFT JOIN auth.users au ON u.user_uuid = au.id
ORDER BY u.id;
      `
    }
  }, h);

  const parsed = JSON.parse(result);
  const textContent = parsed.result?.content?.[0]?.text;
  const inner = JSON.parse(textContent);
  const unescaped = inner.result.replace(/\\n/g, '\n').replace(/\\"/g, '"');
  const match = unescaped.match(/<untrusted-data-[^>]+>([\s\S]*?)<\/untrusted-data-/);
  
  if (match) {
    const data = JSON.parse(match[1]);
    console.log('ID'.padEnd(4) + 'Nome'.padEnd(25) + 'Email'.padEnd(40) + 'Auth Status');
    console.log('─'.repeat(90));
    data.forEach(row => {
      console.log(
        `${String(row.id).padEnd(4)}` +
        `${(row.full_name || '').padEnd(25)}` +
        `${(row.email || '').padEnd(40)}` +
        `${row.auth_status}`
      );
    });
    
    const missing = data.filter(r => r.auth_status === '❌ SEM Auth');
    if (missing.length > 0) {
      console.log(`\n⚠️  ${missing.length} usuário(s) sem entrada no Auth:`);
      missing.forEach(r => console.log(`   - ${r.email} (user_uuid: ${r.user_uuid})`));
      console.log('\n💡 Para corrigir: use "Criar Conta" na tela de login, ou crie o usuário no Supabase Dashboard → Authentication → Users');
    } else {
      console.log('\n✅ Todos os usuários estão no Auth!');
    }
  }
}

main().catch(console.error);
