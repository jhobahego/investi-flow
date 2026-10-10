# Escenario: búsqueda de proyectos

## Objetivo

Verificar que una persona usuaria autenticada puede buscar proyectos y obtener resultados coherentes con el criterio ingresado.

## Precondiciones

1. La aplicación está disponible en el entorno de pruebas.
2. Existe una cuenta de prueba con al menos dos proyectos con nombres distintos y conocidos.
3. La sesión de la cuenta de prueba está iniciada.

## Pasos

1. Acceder a la vista de búsqueda de proyectos.
2. Escribir en el campo de búsqueda el nombre (o parte del nombre) de uno de los proyectos conocidos.
3. Ejecutar la búsqueda.
4. Borrar el criterio e ingresar un texto que no coincida con ningún proyecto.
5. Ejecutar la búsqueda nuevamente.
6. Limpiar el campo de búsqueda.

## Resultados esperados

1. La búsqueda con un criterio coincidente muestra el proyecto esperado con su nombre visible.
2. Los resultados solo incluyen proyectos relacionados con el criterio ingresado.
3. La búsqueda sin coincidencias muestra un estado vacío informativo (sin errores ni resultados anteriores).
4. Al limpiar la búsqueda, la vista vuelve a su estado inicial.
5. Si el servicio de búsqueda falla, la vista muestra un mensaje de error visible y permite reintentar.

## Notas

- Escenario de solo lectura sobre datos de prueba aislados; no modifica proyectos.
- No ejecutar contra producción ni con cuentas personales.
