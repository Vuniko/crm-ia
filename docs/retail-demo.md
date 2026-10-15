# Demo del CRM para tiendas

## Alcance

Una instalación representa una sola tienda o negocio. Todos los usuarios autorizados comparten sus registros.
El slug identifica el espacio; no separa empresas. No se habilita multiempresa.
Las etiquetas comerciales cambian; los identificadores de etapas y los datos existentes permanecen iguales.

## Preparación segura

Usa una base local vacía y cuentas ficticias. Sigue `docs/setup.md`.
No reutilices variables de producción ni ejecutes migraciones sobre una base remota.
Las vistas previas comparten producción según `docs/setup.md`; no sirven para cargar datos de demo.
No conectes correos personales ni claves de proveedores para esta demostración.
Usa la moneda configurada. PEN todavía no pertenece a las monedas admitidas.

## Recorrido de demostración

1. Crea una empresa ficticia llamada «Cliente demo». Las oportunidades requieren una empresa.
2. Crea el contacto «Ana Demo», sin correo, y asígnalo a esa empresa.
3. Abre la ficha del contacto y su pestaña de actividad.
4. Selecciona WhatsApp y Nota. Registra «Consulta por zapatillas urbanas, talla 39, color blanco».
5. Selecciona Instagram y Nota. Registra «Cliente confirma el modelo publicado».
6. Selecciona WhatsApp y Tarea. Escribe «Confirmar stock y coordinar recojo» y elige una fecha.
7. Crea «Zapatillas urbanas · talla 39 · Ana», con empresa, responsable e importe `120,50`.
8. Comprueba el importe de 120,50 en la moneda seleccionada. Prueba también `120.50`.
9. Vincula el contacto desde la oportunidad; ambos deben pertenecer a la misma empresa.
10. Registra el seguimiento en la actividad de la oportunidad y completa la tarea.
11. Cierra la oportunidad como venta ganada o perdida desde el proceso comercial.

Repite con «Polo algodón · talla M» y «Audífonos inalámbricos · negro» para ropa y tecnología.
Los importes no aceptan separadores de miles, texto parcial, negativos ni más de dos decimales.
Un importe vacío significa desconocido; cero representa un importe conocido de cero.

## Interacciones por canal

WhatsApp, Instagram, Facebook Messenger, TikTok, atención en tienda y otros canales tienen registro manual.
El canal queda en el título de la actividad o tarea; el cuerpo conserva el detalle original.
Los registros usan la API de actividades existente, sus permisos y su actualización de caché.
No hay envío de mensajes, lectura de bandejas, webhooks ni sincronización automática con Meta.
Las interacciones aparecen en el historial existente. No existe todavía un filtro específico por canal.

## Evaluación single-tenant

Revisión estática: `packages/auth/src/workspace.ts`, `apps/api/src/trpc/middlewares/auth.middleware.ts`,
los routers de contactos y oportunidades, `docs/api.md` y `SECURITY.md`.

- `ALLOWED_SIGN_IN` limita direcciones o dominios; vacío bloquea nuevos accesos.
- El middleware exige una sesión. Los registros comerciales se comparten entre usuarios autenticados.
- Los roles del espacio administran configuración; no proporcionan aislamiento de registros entre tiendas.
- Cambiar el slug o añadir un selector de empresas no crea una frontera de seguridad.
- La autenticación, el esquema, los permisos y las migraciones no cambian en esta propuesta.

Antes de multiempresa se necesitan claves de pertenencia, autorización por registro, cachés aisladas,
separación de agentes, archivos e integraciones y pruebas cruzadas entre dos negocios.
También se necesita una revisión de sesiones existentes al cambiar la lista de acceso.
Esta revisión de código no certifica la configuración activa de producción.

## Validación manual pendiente

En una instalación local, comprueba creación, errores de correo duplicado, historial, tareas y cierre de venta.
Comprueba teclado, panel estrecho y que el canal persiste tras recargar.
No uses datos reales para estas comprobaciones.

## Comprobaciones de esta propuesta

- 201 pruebas de la aplicación y 26 pruebas unitarias de autenticación pasan.
- Las 32 pruebas nuevas cubren importes, canales y tareas de seguimiento.
- La comprobación de tipos y el análisis de los archivos modificados pasan.
- Next.js compila los módulos; el proceso de compilación completo se detiene con `spawn EPERM` al iniciar otro proceso.
- Las pruebas de integración de autenticación necesitan PostgreSQL local y quedan pendientes.
- La comprobación visual con una sesión y una base local queda pendiente.
- No existe configuración local de Median ni una herramienta `mdn` disponible para asignar un identificador de tarea.
