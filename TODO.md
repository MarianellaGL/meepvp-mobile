# TODO de MeepVP: API, mobile y MeepleUI

Revisión del 30-09-2026 sobre `tablescore-api`, `tablescore-mobile` y `MeepleUI`. Este archivo describe trabajo pendiente; los cambios previos de UI siguen sin commitear.

## Contrato que ya existe

- La API tiene estados `active`, `paused` y `finished`, pausa el tiempo jugado, conserva los puntos, permite reanudar y devuelve `totals`/`winners`. El anfitrión puede guardar una foto del tablero y reabrir una partida terminada. La app ya usa esas rutas.
- BGG devuelve colección e imágenes de juegos; puede responder `202 processing`. La app muestra las imágenes y reintenta la importación.
- La extracción de PDF y del catálogo de reglamentos funciona; la app muestra loader, texto y propuesta editable. Las planillas, partidas programadas y estadísticas de cuenta también tienen rutas y pantallas.
- `go test ./...` pasa. No se verificó en esta revisión una sesión real con PostgreSQL, BGG y dispositivos físicos.

## API implementada localmente (sin commit ni push)

- `GET /v1/me/tables` y `POST /v1/me/claim-table` permiten recuperar el token de anfitrión de mesas propias. La migración 00005 vincula las mesas creadas por una cuenta y recupera vínculos anteriores a partir del primer jugador de partidas existentes.
- `POST /v1/sessions/{id}/players` vincula a la cuenta al jugador que se une, incluso si el anfitrión ya había cargado su nombre; impide que otra cuenta reclame ese jugador.
- `GET/PUT/DELETE /v1/me/avatar` guarda la foto por cuenta y limita formato/tamaño.
- `PUT/DELETE /v1/scheduled-games/{id}` permiten cambiar o cancelar un plan que todavía no empezó.
- BGG propaga 429 y `Retry-After`; las rutas antiguas de importación PDF devuelven 410 en vez de crear trabajos que nunca terminan. OpenAPI y README reflejan el cambio.
- La suite de Go pasa. Falta ejecutar la nueva migración en una base de prueba con datos existentes antes de desplegar.

## Mobile implementado localmente (sin commit ni push)

- La app guarda varias mesas con su partida y jugador, migra el formato anterior y combina las mesas locales con `/me/tables` al iniciar sesión. La pantalla Mesas muestra las partidas propias, pausadas y las partidas donde el usuario participa. Falta verificar el recorrido real en dos dispositivos.
- El perfil sube, descarga y borra el avatar de la cuenta; el jugador sin cuenta sigue usando la foto local.
- La importación BGG acepta `429` y su tiempo de espera, permite cancelar, conserva la colección anterior ante error y muestra fotos en Inicio.
- La pantalla de partida escucha invalidaciones por WebSocket y refresca al volver al primer plano, con consultas periódicas como respaldo.
- Las partidas programadas pueden editarse o cancelarse antes de empezar; los recordatorios se recalculan. La biblioteca de PDF ahora llama “extracción” a los datos guardados y limita el texto local.

## P0 — Continuidad e identidad de las partidas

- [x] **Retomar partidas de la cuenta en otro dispositivo.** API lista las mesas propias con token y `/me/sessions` devuelve `myPlayerId`. Mobile recupera las mesas y muestra partidas `active` y `paused` en Mesas. Pendiente QA real en dos teléfonos.
- [x] **Vincular a la cuenta al jugador que se une.** La API vincula al invitado, conserva el acceso anónimo y prueba la unión a un jugador precargado y el bloqueo de doble reclamo.
- [x] **Cubrir la conservación de puntos al pausar con una prueba de contrato.** La prueba asigna puntos de campos y manuales, pausa, reanuda y verifica el total.
- [x] **Permitir varias mesas y recuperar sus partidas.** Mobile guarda una lista de mesas con partida y jugador por código; crear otra conserva las anteriores. Pendiente QA real con varias mesas.

## P1 — Flujos incompletos o frágiles

- [x] **Avatar sincronizado con la cuenta.** Mobile conecta las rutas de avatar y conserva la inicial como alternativa. Pendiente QA en iOS, Android y web.
- [ ] **PDF original y estados de importación.** La UI ya dice “Guardar extracción”, aclara que no conserva el PDF original, limita el texto local y permite reintentar la subida sin elegir de nuevo el archivo. Falta decidir si conservar el archivo original local o en servidor y verificar PDF sin texto, error de red y archivo de más de 20 MB en dispositivos.
- [x] **Resolver el importador PDF antiguo.** La API descontinuó esas rutas con 410 y actualizó OpenAPI/README; mobile ya usa `/v1/pdf/extract`.
- [x] **Importación BGG resistente a esperas.** Mobile respeta 429, permite cancelar, acota los reintentos, conserva la colección anterior y muestra imágenes en Inicio. Pendiente QA con respuestas 202/429 reales.
- [ ] **Integración con Melodice.** El servicio público muestra playlists musicales por juego de mesa; no hay referencias ni rutas en API o mobile. Confirmar si se busca mostrar la playlist/enlace del juego o importar canciones, y definir la fuente y permisos antes de crear un adaptador. BGG cubre la colección de juegos, no la música.
- [x] **Actualización en tiempo real de la partida.** Mobile se une a `session:{id}`, refresca ante `query.invalidate`, reconecta y usa polling como respaldo. Pendiente QA de puntos, pausa, foto y fin desde dos dispositivos.
- [x] **Gestionar partidas programadas.** Mobile edita fecha/jugadores, confirma cancelación y actualiza recordatorios. Pendiente QA en dispositivo.
- [ ] **Ordenar la propiedad y edición de planillas.** `GET /v1/scoring-rules` entrega todas las planillas, incluso las no publicadas, y mobile las llama “guardadas”. Definir propiedad por cuenta, listado “mías”, edición/duplicado y eliminación con restricciones para partidas existentes. Si `isPublic:false` debe seguir significando “no listada”, expresarlo igual en API y UI; si debe significar privada, cambiar el contrato y la autorización.

## P2 — Cuenta, producto y entrega

- [ ] **Elegir el flujo de autenticación móvil.** Mobile usa usuario/contraseña de `/v1/auth`; la API Foundation también ofrece correo, verificación, recuperación y OAuth en `/api/auth`. Definir si esas opciones entran al producto móvil y, en caso afirmativo, implementar el flujo completo sin romper cuentas existentes.
- [ ] **Revisar permisos de puntuación y fotos.** Hoy quien conoce el ID de sesión puede leer y modificar puntajes de cualquier jugador; el token de anfitrión protege pausa, fin y foto. Definir si esta colaboración abierta es la regla de negocio buscada. Si se necesitan puntos propios por usuario o moderación del anfitrión, agregar identidad/capacidades por jugador y errores visibles en mobile.
- [ ] **Cerrar el empaquetado de MeepleUI.** Mobile depende de `file:../MeepleUI/package-dist`, útil para desarrollo local pero no para instalaciones independientes. Publicar/versionar `@decodadev02/meepleui`, actualizar el lockfile y comprobar instalación limpia. El directorio local ya se llama MeepleUI; el repositorio remoto todavía requiere el cambio de nombre.
- [ ] **Unificar el nombre MeepVP en documentación y configuración visible.** La API ya corrigió README, OpenAPI y textos visibles; revisar el resto de la app y los identificadores externos antes de renombrarlos.
- [ ] **QA de recorrido completo.** Probar invitación QR, unión anónima y autenticada, ajuste visible de puntos, pausa/foto/reanudación, vuelta de tabla a edición y a partida, fin/reapertura, BGG, PDF, catálogo y perfiles en iOS, Android y web. Revisar anchos de botones, loaders, errores y estados vacíos con el mismo criterio de contenido.

## Orden sugerido

1. QA de recuperación de mesas, avatar y WebSocket en dos dispositivos, con API y migración de prueba.
2. Definir conservación del PDF original y alcance de Melodice.
3. Definir propiedad y edición de planillas, permisos de puntuación y opciones de autenticación.
4. Empaquetar MeepleUI y recorrer los flujos completos en iOS, Android y web.
