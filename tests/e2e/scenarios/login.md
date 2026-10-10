# Escenario: inicio de sesión

## Objetivo

Verificar que una persona usuaria con una cuenta de prueba puede iniciar sesión y llegar a su panel de proyectos.

## Precondiciones

1. La aplicación está disponible en el entorno de pruebas.
2. Existe una cuenta de prueba conocida, creada con datos aislados y restaurables.
3. No hay sesión activa en el navegador (almacenamiento local sin token de acceso).

## Pasos

1. Abrir la página principal de la aplicación.
2. Acceder a la opción "Iniciar Sesión".
3. Verificar que se muestra el formulario con los campos "Correo electrónico" y "Contraseña" y el botón "Iniciar Sesión".
4. Completar el correo electrónico y la contraseña de la cuenta de prueba.
5. Activar el botón "Iniciar Sesión".
6. Esperar la redirección al panel de proyectos.

## Resultados esperados

1. La página principal muestra el contenido de bienvenida y las opciones de registro e inicio de sesión.
2. La ruta de acceso muestra el formulario de inicio de sesión sin errores.
3. Tras enviar credenciales válidas, la aplicación redirige al panel de proyectos.
4. El panel muestra los proyectos de la cuenta de prueba.
5. Con credenciales inválidas, la aplicación permanece en el acceso y muestra un mensaje de error visible, sin redirigir.

## Notas

- No ejecutar este escenario contra producción ni con cuentas personales.
- Las credenciales de prueba se proveen por variables de entorno; nunca se guardan en el repositorio.
