import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { sampleRouter } from "./routes/sample";
import { aiRouter } from "./routes/ai";
import { logger } from "hono/logger";

const app = new Hono();

// CORS middleware - validates origin against allowlist
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Password reset page — Supabase redirects here with tokens in URL hash fragment
app.get("/", (c) => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return c.html(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Appbello — Redefinir Senha</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #F7F5FF;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 24px;
      padding: 40px 32px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 8px 40px rgba(83,51,237,0.12);
      border: 1px solid #E4DFF5;
    }
    .logo {
      width: 64px; height: 64px;
      background: #EEE9FF;
      border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
      font-size: 28px;
    }
    h1 { color: #1A1035; font-size: 22px; font-weight: 800; margin-bottom: 8px; text-align: center; }
    .subtitle { color: #9187B0; font-size: 15px; line-height: 1.5; margin-bottom: 28px; text-align: center; }
    label { display: block; color: #9187B0; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 6px; margin-top: 16px; }
    input {
      width: 100%; padding: 14px 16px;
      border: 1.5px solid #E4DFF5;
      border-radius: 12px;
      font-size: 16px;
      color: #1A1035;
      background: #F0EDF9;
      outline: none;
      box-sizing: border-box;
    }
    input:focus { border-color: #5333ED; background: #fff; }
    .btn {
      display: block; width: 100%; margin-top: 24px;
      background: linear-gradient(135deg, #7B5FFF, #5333ED, #3D1FD9);
      color: #fff; font-size: 16px; font-weight: 700;
      padding: 16px; border-radius: 14px;
      border: none; cursor: pointer;
      box-shadow: 0 6px 20px rgba(83,51,237,0.35);
    }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .error {
      color: #E53935; font-size: 14px; margin-top: 12px;
      background: #FFF0F0; border: 1px solid rgba(229,57,53,0.2);
      padding: 10px 14px; border-radius: 10px; display: none;
    }
    .success {
      text-align: center; display: none;
    }
    .success-icon {
      width: 80px; height: 80px; border-radius: 24px;
      background: #E8FBF0; border: 1.5px solid rgba(34,197,94,0.3);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px; font-size: 36px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div id="form-view">
      <div class="logo">✂️</div>
      <h1>Nova senha</h1>
      <p class="subtitle">Escolha uma senha forte para proteger sua conta.</p>
      <label for="pwd">Nova senha</label>
      <input type="password" id="pwd" placeholder="Mínimo 6 caracteres" />
      <label for="pwd2">Confirmar senha</label>
      <input type="password" id="pwd2" placeholder="Repita a nova senha" />
      <div class="error" id="error-msg"></div>
      <button class="btn" id="submit-btn" onclick="handleSubmit()">Salvar nova senha</button>
    </div>
    <div class="success" id="success-view">
      <div class="success-icon">✅</div>
      <h1>Senha redefinida!</h1>
      <p class="subtitle" style="margin-top:8px">Sua senha foi atualizada. Volte ao app Appbello e faça login com a nova senha.</p>
    </div>
    <div id="error-view" style="display:none; text-align:center">
      <div class="logo">⚠️</div>
      <h1>Link inválido</h1>
      <p class="subtitle">Este link expirou ou já foi usado. Solicite um novo email de redefinição de senha no app.</p>
    </div>
  </div>

  <script>
    var SUPABASE_URL = '${supabaseUrl}';
    var SUPABASE_KEY = '${supabaseKey}';
    var accessToken = null;

    (function init() {
      var hash = window.location.hash.slice(1);
      if (!hash) { showError(); return; }
      var params = {};
      hash.split('&').forEach(function(p) {
        var kv = p.split('=');
        if (kv[0]) params[decodeURIComponent(kv[0])] = kv[1] ? decodeURIComponent(kv[1]) : '';
      });
      if (params.type !== 'recovery' || !params.access_token) { showError(); return; }
      accessToken = params.access_token;
    })();

    function showError() {
      document.getElementById('form-view').style.display = 'none';
      document.getElementById('error-view').style.display = 'block';
    }

    async function handleSubmit() {
      var pwd = document.getElementById('pwd').value;
      var pwd2 = document.getElementById('pwd2').value;
      var errEl = document.getElementById('error-msg');
      errEl.style.display = 'none';

      if (!pwd) { errEl.textContent = 'Digite a nova senha.'; errEl.style.display = 'block'; return; }
      if (pwd.length < 6) { errEl.textContent = 'A senha deve ter ao menos 6 caracteres.'; errEl.style.display = 'block'; return; }
      if (pwd !== pwd2) { errEl.textContent = 'As senhas não coincidem.'; errEl.style.display = 'block'; return; }

      var btn = document.getElementById('submit-btn');
      btn.disabled = true;
      btn.textContent = 'Salvando...';

      try {
        var res = await fetch(SUPABASE_URL + '/auth/v1/user', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken,
            'apikey': SUPABASE_KEY
          },
          body: JSON.stringify({ password: pwd })
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.msg || data.message || 'Erro ao atualizar senha');
        document.getElementById('form-view').style.display = 'none';
        document.getElementById('success-view').style.display = 'block';
      } catch(e) {
        errEl.textContent = e.message || 'Erro ao salvar senha. Tente novamente.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Salvar nova senha';
      }
    }
  </script>
</body>
</html>`);
});

// Upload endpoint
app.post("/api/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  const storageForm = new FormData();
  storageForm.append("file", file);

  const response = await fetch("https://storage.vibecodeapp.com/v1/files/upload", {
    method: "POST",
    body: storageForm,
  });

  if (!response.ok) {
    const error = await response.json() as { error?: string };
    return c.json({ error: error.error || "Upload failed" }, 500);
  }

  const result = await response.json() as { file: { id: string; url: string; originalFilename: string; contentType: string; sizeBytes: number } };
  return c.json({ data: result.file });
});

// Delete file endpoint
app.delete("/api/files/:id", async (c) => {
  const { id } = c.req.param();

  const response = await fetch(`https://storage.vibecodeapp.com/v1/files/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    return c.json({ error: "Delete failed" }, 500);
  }

  return c.json({ data: { success: true } });
});

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/ai", aiRouter);

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
