# 💾 Sistema de Guardado de Documentos

## 🔄 Estado Actual: Guardado Local (LocalStorage)

### ¿Cómo funciona?

Actualmente, el contenido del editor se guarda **localmente en el navegador** usando `localStorage`. Esto significa:

✅ **Ventajas:**
- Los cambios se guardan automáticamente cada 3 segundos
- El contenido persiste al recargar la página
- No requiere cambios en el backend inmediatamente
- Funcional para desarrollo y pruebas

⚠️ **Limitaciones:**
- El contenido solo está disponible en el mismo navegador
- Si cambias de navegador/dispositivo, no verás el contenido
- Si borras los datos del navegador, se pierde el contenido
- No hay sincronización entre usuarios

---

## 🔑 Cómo se Guarda

### Key del LocalStorage

El contenido se guarda con una clave única:

```typescript
`document_content_${entityType}_${entityId}`
```

**Ejemplos:**
- `document_content_project_123` - Documento del proyecto 123
- `document_content_task_456` - Documento de la tarea 456
- `document_content_phase_789` - Documento de la fase 789

### Flujo de Guardado

```
Usuario escribe en el editor
         ↓
Después de 3 segundos sin escribir
         ↓
Autoguardado automático
         ↓
localStorage.setItem('document_content_task_123', contenidoHTML)
         ↓
✓ Guardado en el navegador
```

### Flujo de Carga

```
Usuario abre el editor
         ↓
Sistema busca en localStorage:
  ¿Existe 'document_content_task_123'?
         ↓
    SÍ → Carga el contenido guardado
    NO → Crea contenido inicial con nombre del archivo
```

---

## 🛠️ Migración al Backend (Próximos Pasos)

Para guardar el contenido en el backend, necesitas:

### 1. Actualizar el Modelo en el Backend

```python
# app/models/attachment.py o app/models/document.py

class Attachment(Base):
    __tablename__ = "attachments"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    file_name: Mapped[str]
    file_path: Mapped[str]
    file_size: Mapped[int]
    file_type: Mapped[str]
    
    # NUEVO CAMPO para guardar contenido HTML
    html_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]
```

### 2. Crear Migración de Alembic

```bash
cd investi-flow-api
alembic revision --autogenerate -m "add_html_content_to_attachments"
alembic upgrade head
```

### 3. Crear/Actualizar Endpoint en el Backend

```python
# app/api/api_v1/endpoints/attachments.py

@router.patch("/documentos/{document_id}/content")
async def save_document_content(
    document_id: int,
    content: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Guarda el contenido HTML del documento"""
    
    # Buscar documento
    document = attachment_repository.get_by_id(db, document_id)
    
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    # Verificar permisos (que el usuario tenga acceso al proyecto)
    # ... lógica de permisos ...
    
    # Actualizar contenido
    document.html_content = content
    document.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Contenido guardado exitosamente"}


@router.get("/documentos/{document_id}/content")
async def get_document_content(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene el contenido HTML del documento"""
    
    document = attachment_repository.get_by_id(db, document_id)
    
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    # Verificar permisos
    # ... lógica de permisos ...
    
    return {
        "html_content": document.html_content or "",
        "file_name": document.file_name
    }
```

### 4. Actualizar el Frontend

Descomentar y actualizar en `DocumentEditorView.vue`:

```typescript
// En loadDocument()
async function loadDocument() {
  // ... código existente ...
  
  try {
    // NUEVO: Intentar cargar desde el backend primero
    const response = await apiClient.get(
      `/documentos/${entityId.value}/content`
    )
    
    if (response.data.html_content) {
      documentContent.value = response.data.html_content
    } else {
      // Fallback a contenido inicial
      documentContent.value = '<h1>...</h1>'
    }
  } catch (err) {
    // Si falla, usar localStorage como fallback
    const savedContent = localStorage.getItem(getStorageKey())
    if (savedContent) {
      documentContent.value = savedContent
    }
  }
}

// En saveDocument()
async function saveDocument() {
  try {
    // NUEVO: Guardar en el backend
    await apiClient.patch(
      `/documentos/${entityId.value}/content`,
      { content: documentContent.value }
    )
    
    // También guardar en localStorage como backup
    localStorage.setItem(getStorageKey(), documentContent.value)
    
    console.log('✓ Guardado en el servidor')
  } catch (err) {
    console.error('Error:', err)
  }
}
```

---

## 📊 Datos Guardados

### Formato del Contenido

El contenido se guarda en formato **HTML** generado por TipTap:

```html
<h1>Introducción</h1>
<p>Este documento presenta los resultados de la investigación...</p>
<h2>Metodología</h2>
<p>Se utilizó un enfoque <strong>cualitativo</strong>...</p>
<ul>
  <li>Entrevistas</li>
  <li>Observaciones</li>
</ul>
```

### Tamaño Aproximado

Un documento típico de 5000 palabras ocupa aproximadamente **50-100 KB** en localStorage.

---

## 🔍 Cómo Ver el Contenido Guardado

### Desde las DevTools del Navegador:

1. Abre DevTools (F12)
2. Ve a la pestaña **Application** (Chrome) o **Storage** (Firefox)
3. En el menú lateral, selecciona **Local Storage** → `http://localhost:5173`
4. Busca las claves que empiecen con `document_content_`

### Usando la Consola:

```javascript
// Ver todos los documentos guardados
Object.keys(localStorage)
  .filter(key => key.startsWith('document_content_'))
  .forEach(key => {
    console.log(key, localStorage.getItem(key).substring(0, 100))
  })

// Ver un documento específico
localStorage.getItem('document_content_task_123')

// Borrar un documento
localStorage.removeItem('document_content_task_123')

// Borrar todos los documentos
Object.keys(localStorage)
  .filter(key => key.startsWith('document_content_'))
  .forEach(key => localStorage.removeItem(key))
```

---

## 🚨 Consideraciones Importantes

### Límite de LocalStorage

- **Límite típico:** 5-10 MB por dominio
- **Un documento grande:** ~100 KB
- **Capacidad aproximada:** 50-100 documentos grandes

### Cuándo Migrar al Backend

Deberías migrar al backend cuando:
- ✅ Necesites compartir documentos entre dispositivos
- ✅ Quieras colaboración entre usuarios
- ✅ Tengas documentos muy grandes (>1 MB)
- ✅ Necesites historial de versiones
- ✅ Quieras backup en el servidor

---

## ✅ Checklist de Migración

Cuando estés listo para migrar al backend:

- [ ] Agregar campo `html_content` al modelo
- [ ] Crear migración de Alembic
- [ ] Implementar endpoint `PATCH /documentos/{id}/content`
- [ ] Implementar endpoint `GET /documentos/{id}/content`
- [ ] Actualizar `DocumentEditorView.vue` para usar los endpoints
- [ ] Probar guardado y carga desde el servidor
- [ ] Mantener localStorage como fallback/backup
- [ ] Agregar indicador visual de "guardado en el servidor"
- [ ] Implementar manejo de conflictos (si se edita en 2 dispositivos)
- [ ] Considerar agregar historial de versiones

---

## 💡 Recomendaciones

### Para Producción

1. **Implementa el guardado en backend lo antes posible**
2. **Mantén localStorage como cache local** para mejor performance
3. **Agrega sincronización automática** cada X minutos
4. **Implementa detección de conflictos** si múltiples usuarios editan
5. **Considera usar WebSockets** para colaboración en tiempo real

### Para Desarrollo

El sistema actual de localStorage es **suficiente para**:
- ✅ Desarrollo y pruebas
- ✅ Demostración de funcionalidad
- ✅ Prototipado rápido
- ✅ Uso personal en un solo dispositivo

---

## 📝 Resumen

**Estado Actual:**
- ✅ Guardado funcional en localStorage
- ✅ Autoguardado cada 3 segundos
- ✅ Persistencia al recargar página
- ⚠️ Solo disponible localmente

**Próximo Paso:**
- Implementar guardado en backend siguiendo los pasos arriba
- Migrar contenido de localStorage al servidor (una sola vez)
- Mejorar UX con indicadores de sincronización

---

**Fecha:** Octubre 27, 2025  
**Estado:** LocalStorage implementado, Backend pendiente
