# Ateneo Siglo XXI — Validador de Socios

Herramienta web para validar emails de socios a partir de un archivo `.csv`.  
Diseño con temática andaluza tradicional.

## Características

- Carga de archivos CSV mediante clic o arrastrar y soltar
- Detección automática del separador (`,` `;` o tabulador)
- Detección automática de la columna de email
- Validación de formato (RFC 5322 simplificado)
- Detección de duplicados
- Búsqueda individual de email en el listado
- Estadísticas: total, válidos, inválidos, duplicados
- Filtrado y búsqueda en la tabla de resultados
- Exportación de resultados a CSV

## Estructura del proyecto

```
cursor validator/
├── index.html        # Página principal
├── styles.css        # Estilos con temática andaluza
├── app.js            # Lógica de validación
└── assets/
    └── ateneo_logo.png
.gitignore
README.md
```

## Uso

1. Abre `cursor validator/index.html` en tu navegador (no requiere servidor).
2. Carga el archivo CSV con el listado de socios.
3. El archivo debe tener una columna con encabezado `email`, `correo`, `e-mail` o similar.
4. Usa el buscador para verificar un email concreto.
5. Exporta los resultados filtrados si lo necesitas.

## Formato CSV esperado

```csv
nombre,apellidos,email,telefono
Ana García,López,ana.garcia@ejemplo.com,600000001
...
```

## Publicar en GitHub Pages

```bash
git init
git add .
git commit -m "feat: validador de socios Ateneo Siglo XXI"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ateneo-validador.git
git push -u origin main
```

Activa **GitHub Pages** desde `Settings → Pages → Branch: main / root`.

---

*Ateneo Siglo XXI · Asociación Cultural Andaluza*
