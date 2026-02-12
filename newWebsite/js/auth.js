// ── Supabase client ──
const SUPABASE_URL = 'https://cexnxqyqllnmlviacnex.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNleG54cXlxbGxubWx2aWFjbmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDE5MjcsImV4cCI6MjA4NjQ3NzkyN30.D11zE5IdWq8neBZRmoPsajxDvWi4DL1vWsTL0k_Ipa0';

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Path helpers ──
const _inPages = window.location.pathname.includes('/pages/');
const _root = _inPages ? '../' : '';
const _pages = _inPages ? '' : 'pages/';

// ── Auth helpers ──
async function getSession() {
    const { data: { session } } = await _supabase.auth.getSession();
    return session;
}

async function getCurrentUser() {
    const session = await getSession();
    return session?.user ?? null;
}

async function getProfile(userId) {
    const { data, error } = await _supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error && error.code !== 'PGRST116') console.error('Profile fetch error:', error);
    return data;
}

async function isProfileComplete(userId) {
    const profile = await getProfile(userId);
    return profile && profile.display_name && profile.display_name.trim() !== '';
}

async function signOut() {
    await _supabase.auth.signOut();
    window.location.href = _root + 'index.html';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// ── Auth guard ──
async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = _root + _pages + 'login.html';
        return;
    }
    const complete = await isProfileComplete(user.id);
    if (!complete) {
        window.location.href = _root + _pages + 'profile-setup.html';
    }
}

// ── Nav updater ──
async function updateNavAuth() {
    const nav = document.querySelector('.navigation ul');
    if (!nav) return;

    const user = await getCurrentUser();
    if (user) {
        const profile = await getProfile(user.id);
        const name = profile?.display_name || user.email;
        const li = document.createElement('li');
        li.innerHTML = `<span style="color:plum;padding:16px 12px;font-size:14px;">${escapeHtml(name)}</span>` +
            `<a href="#" id="nav-logout" style="font-size:13px;">Logout</a>`;
        nav.appendChild(li);
        document.getElementById('nav-logout').addEventListener('click', (e) => {
            e.preventDefault();
            signOut();
        });
    } else {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${_root}${_pages}login.html">Login</a>`;
        nav.appendChild(li);
    }
}

document.addEventListener('DOMContentLoaded', updateNavAuth);
