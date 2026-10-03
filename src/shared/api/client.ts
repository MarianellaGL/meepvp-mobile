// HTTP client shared by every feature: base URL, auth header and
// Spanish error messages for the API's known errors.
export const baseURL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '') || 'http://localhost:8080';
let authToken: string | null = null;
export function setAuthToken(token: string | null) { authToken = token; }
export function getAuthToken() { return authToken; }
export class APIRequestError extends Error {
  constructor(message: string, public status: number, public retryAfterSeconds?: number) { super(message); }
}

export function apiErrorMessage(message: string | undefined, status: number): string {
  const known: Record<string, string> = {
    'invalid username or password': 'Usuario o contraseña incorrectos.',
    'username is already taken': 'Ese nombre de usuario ya está en uso.',
    'login required': 'Tenés que iniciar sesión.',
    'host token required': 'Solo el anfitrión puede hacer eso.',
    'resource not found': 'No encontramos lo que buscabas.',
    'invalid input': 'Revisá los datos ingresados.',
    'rulebook catalog unavailable': 'No pudimos consultar el catálogo de reglamentos. Reintentá en unos minutos.',
    'could not download rulebook': 'No pudimos descargar ese reglamento. Reintentá o elegí otro.',
    'could not extract rulebook PDF': 'No pudimos leer ese PDF. Podés probar con otro reglamento.',
    'AI scoring assistant unavailable': 'La asistencia de IA no está disponible ahora. Podés crear la planilla manualmente.',
    'AI provider quota exhausted': 'La asistencia de IA alcanzó su límite de uso. Podés continuar con una planilla manual.',
    'AI provider rate limited': 'La asistencia de IA está ocupada. Esperá un momento y volvé a intentar.',
    'AI provider authentication failed': 'La asistencia de IA no está configurada correctamente. Podés continuar con una planilla manual.',
    'could not generate scoring suggestion': 'No pudimos generar una propuesta con IA. Reintentá o creá la planilla manualmente.',
    'AI rule answers unavailable': 'Las respuestas sobre reglas no están disponibles por ahora. Podés consultar el reglamento.',
    'no rulebook linked to this game': 'Este juego todavía no tiene un reglamento vinculado.',
    'could not answer rule question': 'No pudimos responder la pregunta. Reintentá en unos minutos.',
    'question must be 3 to 300 characters': 'Escribí una pregunta de 3 a 300 caracteres.',
  };
  if (message && known[message]) return known[message];
  if (status === 429) return 'Hay demasiadas solicitudes. Esperá un momento y reintentá.';
  if (status >= 500) return 'El servidor tuvo un problema. Reintentá en unos minutos.';
  return 'No pudimos completar la solicitud. Revisá los datos e intentá de nuevo.';
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseURL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}), ...options?.headers },
  });
  const body = await response.json().catch(() => null) as (T & { error?: string; retryAfterSeconds?: number }) | null;
  if (!response.ok && response.status !== 202) {
    const headerRetry = Number(response.headers.get('Retry-After'));
    const retryAfter = body?.retryAfterSeconds ?? (Number.isFinite(headerRetry) && headerRetry > 0 ? headerRetry : undefined);
    throw new APIRequestError(apiErrorMessage(body?.error, response.status), response.status, retryAfter);
  }
  if (body === null) throw new APIRequestError('El servidor devolvió una respuesta inválida. Reintentá en unos minutos.', response.status);
  return body;
}

