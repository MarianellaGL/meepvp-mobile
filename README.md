# MeppVP Mobile

Aplicación Expo SDK 57 para llevar puntuaciones de juegos de mesa, compartir planillas y consultar ganadores y estadísticas. Usa `@decodadev02/scoreui` y la [API de MeppVP](https://github.com/MarianellaGL/meepvp-api).

## Ejecutar en local

Para usar la API desplegada en Render, configurá `EXPO_PUBLIC_API_URL` en `.env`
con la URL HTTPS pública del servicio, sin `/docs` ni `/v1`. La app agrega las
rutas correspondientes. No necesita credenciales de Neon ni `DATABASE_URL`.
Después de cambiar la URL, recargá completamente la app; si Expo sigue abierto,
reinicialo con `npx expo start --clear`.

La URL se incluye en el bundle de Expo. Las compilaciones distribuidas necesitan
esa misma variable configurada en su entorno de build. La dirección de la API
es pública y visible en el bundle y el tráfico de red; no es una credencial.
El archivo `.env` queda fuera de Git. Cambiar `.env` después de compilar no
actualiza una app ya instalada.

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

El menú inferior muestra Inicio, Biblioteca, Nueva partida, Puntuar y Perfil.
El historial se abre desde **Perfil → Historial de partidas**, con regreso al perfil.


Al abrir la app se puede registrar una cuenta, iniciar sesión, continuar sin cuenta o unirse a una partida. Para unirse se escanea el QR de una partida activa o se ingresa el código de seis caracteres junto con el nombre del jugador. El QR contiene un enlace `meepvp://join?code=...`; el enlace directo requiere que la app esté instalada. La API resuelve ese código a la partida activa. Una partida terminada no genera QR y su código ya no permite unirse; aparece en Historial. El anfitrión puede finalizarla y la API devuelve el ganador o todos los jugadores empatados según la regla de puntuación.

El anfitrión puede pausar una partida larga y reanudarla días después. El contador muestra el tiempo realmente jugado, sin contar la pausa. Mientras está pausada, los puntos quedan bloqueados y la partida sigue visible en Inicio y Mesas. Se puede sacar o elegir una foto del tablero para retomarlo luego desde otro dispositivo; la API guarda la última foto, con límite de 5 MB. Quienes tengan el enlace de la partida pueden verla.

La biblioteca consulta las planillas guardadas en la base de datos cada vez que se abre y permite actualizar la lista manualmente. El lector de imágenes reconoce texto localmente en una foto o captura, permite corregirlo y pide revisar los puntos antes de guardar. El lector de PDF extrae texto seleccionable y, cuando la API corre en macOS, usa OCR para páginas escaneadas. Los recordatorios de partidas programadas son notificaciones locales.

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
| Buscar y leer reglamentos del catálogo | `GET /v1/rulebooks`, `POST /v1/rulebooks/{id}/extract` |
| Extraer texto de PDF | `POST /v1/pdf/extract` |
| Crear mesa y partida | `POST /v1/tables`, `/v1/tables/{code}/sessions` |
| Resolver el código de una partida activa | `GET /v1/tables/{code}/current-session` |
| Consultar partida, agregar jugadores y puntos | `GET /v1/sessions/{id}`, `POST /v1/sessions/{id}/players`, `PATCH /v1/sessions/{id}/scores`, `POST /v1/sessions/{id}/points` |
| Finalizar o reabrir partida | `POST /v1/sessions/{id}/finish`, `/reopen` |
| Pausar, reanudar y guardar foto del tablero | `POST /v1/sessions/{id}/pause`, `/resume`, `POST/GET /v1/sessions/{id}/board-photo` |
| Programar partidas | `GET/POST /v1/tables/{code}/scheduled-games`, `PATCH /v1/scheduled-games/{id}/rule`, `/session` |

## Cuentas y datos locales

Las cuentas usan nombre de usuario y contraseña. La inscripción pide confirmar la contraseña. El token de sesión se guarda en Expo SecureStore en iOS y Android, y en `localStorage` en web. Las estadísticas e historial de una cuenta solo se consultan con su token. La app intenta asociar la última partida anónima al ingresar, mediante el token privado del anfitrión y el ID del jugador; las partidas anteriores sin esa prueba no se asocian automáticamente.

El token del anfitrión y la última partida quedan en el dispositivo. La colección, las planillas y el texto extraído de PDF tienen copias locales para consultar sin conexión. La API guarda planillas y partidas en PostgreSQL y no conserva el PDF original.

Compartir una planilla con la comunidad requiere iniciar sesión y marca `isPublic: true`. Las planillas sin esa marca no aparecen en la búsqueda de la comunidad, pero `GET /v1/scoring-rules` actualmente las devuelve a cualquiera con acceso a la API: son no listadas, no confidenciales. Todavía no hay moderación de publicaciones. El backend incorpora autenticación por email, OAuth y recuperación de contraseña de Foundation; esta app conserva el acceso por usuario de `/v1`, cuyas cuentas antiguas no tienen email para recuperación.

## Importar reglamentos

Desde **Biblioteca → Buscar reglamentos**, buscá un juego en inglés o francés,
elegí el juego base o la expansión correcta y tocá **Leer y crear planilla**.
La API consulta rule-book.org y conserva sus metadatos en PostgreSQL; Catan, Everdell y
Wingspan en inglés están disponibles desde la migración inicial del catálogo.
Si el proveedor falla, devuelve coincidencias guardadas e indica que son una
copia local. No necesita el token de BGG. Una búsqueda sin coincidencias guardadas
puede fallar si el proveedor no responde.

El lector muestra la fuente junto con la propuesta. **Crear planilla** abre los
campos editables existentes: nombres, tipos, puntos por unidad y condición de
victoria. Revisá y corregí la propuesta; recién al guardar se crea la planilla
persistente con su `rulebookId`, que luego podés usar en una partida. El texto
extraído queda en la biblioteca del dispositivo; el servidor no guarda el PDF.
Este flujo requiere desplegar la nueva versión de la API para aplicar la
migración del catálogo. Otros reglamentos se completan con tablas detectadas o
campos manuales; no hay inferencia general por IA.


El lector conserva la extracción de tablas impresas y acepta propuestas revisadas del backend para los reglamentos base en inglés de Everdell, Catan y Wingspan. Everdell precarga cinco categorías de puntos finales. Catan precarga contadores de poblados, ciudades y cartas de victoria, y marcas para los dos bonos. Podés revisar y editar los campos antes de guardar la planilla. Las notas explican los desempates de Everdell y la victoria de Catan en el propio turno: la app todavía no los automatiza. Las expansiones y el modo solitario se revisan manualmente. Para PDFs guardados antes de esta actualización, elegí nuevamente el archivo para recibir la propuesta.

## Verificaciones

```sh
npx expo lint
npx tsc --noEmit
node --test tests/scoringDraft.test.cjs
```

Wingspan base precarga seis categorías: aves, bonificaciones y objetivos de ronda
como puntos finales; huevos, alimento almacenado sobre aves y cartas debajo de
aves como contadores de un punto por unidad. No cuentan el alimento de la reserva
ni las cartas en mano. Los objetivos de ronda se cargan según el tablero elegido;
el desempate final por alimento sin usar se revisa en la mesa. La propuesta no
incluye expansiones, Automa ni modo Dúo.

Las próximas mecánicas de anulación de puntos y modo duelo están anotadas en el
[backlog de producto](https://github.com/MarianellaGL/meepvp-api/blob/main/PRODUCT_BACKLOG.md).
