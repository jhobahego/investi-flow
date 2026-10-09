# Escenario: gestión de tareas del proyecto

## Objetivo

Verificar que una persona usuaria autenticada puede consultar y actualizar el estado de las tareas de un proyecto de prueba.

## Precondiciones

1. La aplicación está disponible en el entorno de pruebas.
2. Existe una cuenta de prueba con un proyecto que contiene tareas en distintos estados (por hacer, en curso, terminada).
3. La sesión de la cuenta de prueba está iniciada.
4. Los datos del proyecto son aislados y restaurables al finalizar.

## Pasos

1. Abrir el panel de proyectos y seleccionar el proyecto de prueba.
2. Verificar que el tablero muestra las tareas en sus columnas según su estado.
3. Mover una tarea de "por hacer" a "en curso".
4. Marcar una tarea "en curso" como terminada.
5. Recargar la vista del proyecto.
6. Restaurar las tareas a su estado inicial.

## Resultados esperados

1. El tablero muestra cada tarea en la columna correspondiente a su estado.
2. Cada cambio de estado se refleja de inmediato en la columna correcta.
3. Tras recargar, los cambios de estado persisten.
4. Si una actualización falla, la tarea conserva su estado anterior y se muestra un mensaje de error visible.
5. Al finalizar, los datos de prueba quedan restaurados a su estado inicial.

## Notas

- Este es el único escenario con escritura; exige entorno y datos de prueba dedicados.
- No ejecutar contra producción ni con cuentas personales.
