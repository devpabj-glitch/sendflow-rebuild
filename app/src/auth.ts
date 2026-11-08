// Autenticação local: usuários persistidos em localStorage com senha em SHA-256.
// Usuário inicial: br@gmail.com / 730287

const USERS_KEY = 'orbit.users'
const SESSION_KEY = 'orbit.session'

export type OrbitUser = { email: string; hash: string; name: string }

export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function readUsers(): OrbitUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as OrbitUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: OrbitUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// Garante que o usuário inicial exista (idempotente).
export async function ensureSeedUser() {
  const users = readUsers()
  if (!users.some(u => u.email === 'br@gmail.com')) {
    users.push({ email: 'br@gmail.com', hash: await sha256('730287'), name: 'BR' })
    writeUsers(users)
  }
}

export async function login(email: string, password: string): Promise<{ ok: boolean; name?: string }> {
  await ensureSeedUser()
  const norm = email.trim().toLowerCase()
  const hash = await sha256(password)
  const user = readUsers().find(u => u.email === norm && u.hash === hash)
  if (!user) return { ok: false }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, name: user.name, at: Date.now() }))
  return { ok: true, name: user.name }
}

export function currentUser(): { email: string; name: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as { email: string; name: string }) : null
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export async function registerUser(email: string, password: string, name?: string): Promise<{ ok: boolean; error?: string }> {
  await ensureSeedUser()
  const norm = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) return { ok: false, error: 'E-mail inválido.' }
  if (password.length < 4) return { ok: false, error: 'A senha precisa ter ao menos 4 caracteres.' }
  const users = readUsers()
  if (users.some(u => u.email === norm)) return { ok: false, error: 'Este e-mail já está cadastrado.' }
  users.push({ email: norm, hash: await sha256(password), name: name || norm.split('@')[0] })
  writeUsers(users)
  return { ok: true }
}
