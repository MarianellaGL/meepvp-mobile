# MeepVP Mobile

Aplicación Expo SDK 57 para llevar puntuaciones de juegos de mesa, compartir planillas y consultar ganadores y estadísticas. Usa `@decodadev02/scoreui` y la [API de MeepVP](https://github.com/MarianellaGL/meepvp-api).

## Ejecutar en local

1. Iniciá PostgreSQL y la API siguiendo el README del repositorio de la API.
2. Copiá `.env.example` a `.env` y configurá `EXPO_PUBLIC_API_URL`. En un celular físico usá la IP local de tu computadora: `localhost` apunta al celular.
3. Instalá las dependencias e iniciá Expo:

```sh
pnpm install --ignore-scripts
npx expo start
```

`--ignore-scripts` evita el bloqueo actual del script de compilación de `unrs-resolver`. También podés iniciar con `npx expo start --android`, `--ios` o `--web`.

El lector de imágenes usa `expo-text-extractor` y necesita una compilación nativa de desarrollo o producción en iOS o Android; no funciona en Expo Go ni en web. El escáner QR usa `expo-camera` y también requiere una compilación de desarrollo después de agregar la dependencia nativa. Podés crearla con `npx expo run:android`, `npx expo run:ios` o EAS. En web, ingresá el código de mesa manualmente.

## Flujo de juego

Al abrir la app se puede registrar una cuenta, iniciar sesión, continuar sin cuenta o unirse a una partida. Para unirse se escanea el QR de una partida activa o se ingresa el código de seis caracteres junto con el nombre del jugador. El QR contiene un enlace `meepvp://join?code=...`; el enlace directo requiere que la app esté instalada. La API resuelve ese código a la partida activa. Una partida terminada no genera QR y su código ya no permite unirse; aparece en Historial. El anfitrión puede finalizarla y la API devuelve el ganador o todos los jugadores empatados según la regla de puntuación.

La biblioteca consulta las planillas guardadas en la base de datos cada vez que se abre y permite actualizar la lista manualmente. El lector de imágenes reconoce texto localmente en una foto o captura, permite corregirlo y pide revisar los puntos antes de guardar. El lector de PDF extrae texto seleccionable; el OCR de PDF escaneados todavía no está disponible. Los recordatorios de partidas programadas son notificaciones locales.

## Rutas de la API

| Función | Ruta |
| --- | --- |
| Registro, ingreso y salida | `POST /v1/auth/signup`, `/login`, `/logout` |
| Perfil, estadísticas e historial de la cuenta | `GET /v1/me`, `/v1/me/stats`, `/v1/me/sessions` |
| Asociar una partida anónima reciente | `POST /v1/me/claim-session` |
| Estado de la API | `GET /health` |
| Colección y conversaciones de BoardGameGeek | `GET /v1/bgg/collections/{username}`, `/v1/bgg/games/{gameID}/rules` |
| Listar y crear planillas | `GET/POST /v1/scoring-rules` |
| Buscar planillas compartidas | `GET /v1/community/scoring-rules` |
| Extraer texto de PDF | `POST /v1/pdf/extract` |
| Crear mesa y partida | `POST /v1/tables`, `/v1/tables/{code}/sessions` |
| Resolver el código de una partida activa | `GET /v1/tables/{code}/current-session` |
| Consultar partida, agregar jugadores y puntos | `GET /v1/sessions/{id}`, `POST /v1/sessions/{id}/players`, `PATCH /v1/sessions/{id}/scores`, `POST /v1/sessions/{id}/points` |
| Finalizar o reabrir partida | `POST /v1/sessions/{id}/finish`, `/reopen` |
| Programar partidas | `GET/POST /v1/tables/{code}/scheduled-games`, `PATCH /v1/scheduled-games/{id}/rule`, `/session` |

## Cuentas y datos locales

Las cuentas usan nombre de usuario y contraseña. La inscripción pide confirmar la contraseña. El token de sesión se guarda en Expo SecureStore en iOS y Android, y en `localStorage` en web. Las estadísticas e historial de una cuenta solo se consultan con su token. La app intenta asociar la última partida anónima al ingresar, mediante el token privado del anfitrión y el ID del jugador; las partidas anteriores sin esa prueba no se asocian automáticamente.

El token del anfitrión y la última partida quedan en el dispositivo. La colección, las planillas y el texto extraído de PDF tienen copias locales para consultar sin conexión. La API guarda planillas y partidas en PostgreSQL y no conserva el PDF original.

Compartir una planilla con la comunidad requiere iniciar sesión y marca `isPublic: true`. Las planillas sin esa marca no aparecen en la búsqueda de la comunidad, pero `GET /v1/scoring-rules` actualmente las devuelve a cualquiera con acceso a la API: son no listadas, no confidenciales. Todavía no hay moderación de publicaciones ni recuperación de contraseñas.

## Verificaciones

```sh
npx expo lint
npx tsc --noEmit
```
