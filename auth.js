const form = document.getElementById('authForm');
const tabs = [...document.querySelectorAll('.auth-tab')];
let mode = new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login';

async function readApiResponse(response) {
  const raw = await response.text();
  let data = {};
  if (raw) {
    try { data = JSON.parse(raw); }
    catch {
      const message = response.status >= 500
        ? 'The server is temporarily unavailable. Please try again.'
        : 'The server returned an unexpected response. Please try again.';
      throw new Error(message);
    }
  }
  if (!response.ok) throw new Error(data.error || data.message || 'Unable to continue. Please try again.');
  return data;
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  });
  return readApiResponse(response);
}

const setMode = value => {
  mode = value;
  tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));
  document.getElementById('nameGroup').classList.toggle('hidden', mode !== 'register');
  document.getElementById('name').required = mode === 'register';
  document.getElementById('formTitle').textContent = mode === 'register' ? 'Create your account' : 'Welcome back';
  document.getElementById('formSubtitle').textContent = mode === 'register'
    ? 'Sign up to buy and track mobile data bundles.'
    : 'Log in to your DataVault account.';
  document.getElementById('submitButton').innerHTML = (mode === 'register' ? 'Create account' : 'Log in') + ' <i class="fa-solid fa-arrow-right"></i>';
  document.getElementById('formMessage').textContent = '';
  document.getElementById('password').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
};
tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
setMode(mode);

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = document.getElementById('submitButton');
  const message = document.getElementById('formMessage');
  button.disabled = true;
  button.textContent = 'Please wait…';
  message.textContent = '';
  const body = {
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  };
  if (mode === 'register') body.name = document.getElementById('name').value;
  try {
    await api('/api/auth/' + (mode === 'register' ? 'register' : 'login'), {
      method: 'POST', body: JSON.stringify(body)
    });
    location.href = '/dashboard.html';
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = (mode === 'register' ? 'Create account' : 'Log in') + ' <i class="fa-solid fa-arrow-right"></i>';
  }
});

async function handleGoogleCredential(response) {
  const message = document.getElementById('googleMessage');
  message.textContent = 'Signing you in…';
  try {
    await api('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential: response.credential })
    });
    location.href = '/dashboard.html';
  } catch (error) {
    message.textContent = error.message;
  }
}

async function setupGoogleSignIn() {
  const host = document.getElementById('googleSignInButton');
  const message = document.getElementById('googleMessage');
  try {
    const config = await api('/api/auth/google/config');
    if (!config.clientId) throw new Error('Google sign-in is not configured yet.');
    const waitForGoogle = () => new Promise((resolve, reject) => {
      let attempts = 0;
      const check = () => {
        if (window.google?.accounts?.id) return resolve();
        if (++attempts > 60) return reject(new Error('Google sign-in could not load. Check your connection and try again.'));
        window.setTimeout(check, 100);
      };
      check();
    });
    await waitForGoogle();
    window.google.accounts.id.initialize({
      client_id: config.clientId,
      callback: handleGoogleCredential,
      ux_mode: 'popup'
    });
    window.google.accounts.id.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: Math.min(360, Math.max(240, host.clientWidth || 320))
    });
  } catch (error) {
    message.textContent = error.message;
  }
}
setupGoogleSignIn();