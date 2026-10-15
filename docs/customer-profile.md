# Ficha del cliente

La ficha y el formulario de creación permiten guardar teléfono, usuario de Instagram y canal preferido.
Todos los campos son opcionales. Un teléfono existente conserva su formato al editar otros datos.
Un perfil sin datos nuevos muestra valores vacíos. No se infiere una preferencia del historial.

## Uso

1. Crea o abre un contacto.
2. Guarda el teléfono con código internacional, por ejemplo `+51 999 123 456`.
3. Guarda el usuario de Instagram, por ejemplo `@ana.demo`. El CRM elimina el `@` inicial.
4. Selecciona WhatsApp, Instagram, llamada, correo, atención en tienda u otro canal.
5. Usa WhatsApp o Instagram en la sección «Contactar» para abrir el destino en otra pestaña.
6. Borra el usuario o selecciona «Sin preferencia» para eliminar ese valor.

El enlace de WhatsApp requiere `+` o `00` y un número internacional de entre 7 y 15 dígitos.
No se asume el país para teléfonos locales. No se comprueba si el número tiene una cuenta de WhatsApp.
Los enlaces no envían mensajes. El vendedor confirma el envío en WhatsApp.
Instagram admite usuarios sin enlaces, rutas, espacios internos ni parámetros.
Los enlaces externos usan destinos fijos y no comparten la dirección de la ficha como referencia.
Consulta el formato oficial en [WhatsApp](https://faq.whatsapp.com/5913398998672934).

El canal preferido indica una elección operativa. No representa consentimiento para campañas.

## Persistencia y compatibilidad

El teléfono utiliza la columna existente `Contact.phone`.
Instagram y canal preferido utilizan `FieldDefinition` y `FieldValue`, sin cambios de esquema ni migraciones.
Las claves internas son `retail_instagram` y `retail_preferred_channel` para la entidad `CONTACT`.
Estos campos no aparecen en la administración de campos personalizados y rechazan cambios desde sus rutas.
La actualización de valores usa `contacts.create` y `contacts.update`, con validación compartida y transacciones existentes.
Omitir un campo conserva su valor. Enviar una cadena vacía elimina solamente el valor solicitado.
Una definición incompatible genera un error y revierte la transacción; no se modifica la definición existente.
Los permisos, la autenticación y el modelo single-tenant permanecen iguales.
La aplicación y la API necesitan esta versión para guardar los campos nuevos.

## Verificación manual local

Usa una base local y datos ficticios. Las vistas previas comparten producción según `docs/setup.md`.
No cargues contactos de prueba en una vista previa conectada a datos reales.

- Crea un contacto con los tres datos nuevos y recarga la ficha.
- Edita un campo y comprueba que los otros conservan sus valores.
- Abre los enlaces sin enviar mensajes y comprueba los destinos.
- Borra Instagram y canal preferido, recarga y comprueba que desaparece el acceso a Instagram.
- Abre un contacto antiguo y comprueba que mantiene teléfono, correo e historial.
- Comprueba que un usuario sin sesión no puede leer ni modificar el contacto.
- Comprueba teclado y pantalla estrecha.

Docker no está en ejecución en este entorno. La verificación con PostgreSQL y sesión local queda pendiente.
