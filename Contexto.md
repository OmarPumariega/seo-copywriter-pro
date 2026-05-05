# Contexto.md

## Qué es esta herramienta

Generador de títulos y meta descripciones SEO optimizados. El usuario introduce una URL, la herramienta analiza el contenido real de esa página y devuelve 3 variantes de título y descripción listas para usar.

## Stack técnico

- Next.js + Tailwind CSS
- Desplegado en Vercel, conectado a GitHub
- OpenAI gpt-4o-mini con la herramienta web_search_preview para visitar y leer la URL real
- La API key de OpenAI vive en el servidor como variable de entorno, nunca expuesta al frontend

## Reglas SEO

Todas las reglas para generar títulos y descripciones están en el archivo `seo-rules.md`. Este archivo debe leerse e inyectarse íntegramente en el system prompt de OpenAI antes de generar cualquier resultado. Es el documento principal de referencia para la calidad del output.

## Interfaz

- Un campo para pegar la URL
- Un botón para analizar
- El resultado aparece justo debajo
- Si la herramienta no puede acceder a la URL, mostrar únicamente el mensaje: "No se ha podido acceder a la URL"

## Formato de salida

Sin texto adicional, sin explicaciones, sin etiquetas extra. Únicamente esto:

```
Variante 1:
Título:
Descripción:

Variante 2:
Título:
Descripción:

Variante 3:
Título:
Descripción:
```

Cada título y cada descripción tiene su propio botón de copiar independiente y un contador de caracteres visible.

## Tipo de página

La herramienta debe detectar automáticamente el tipo de página analizando su contenido y adaptar el tono y el enfoque del SEO en consecuencia:

- **Home:** enfoque de marca, propuesta de valor general
- **Producto:** enfoque en características y beneficio directo del producto
- **Servicio:** enfoque en el problema que resuelve y a quién va dirigido
- **Blog/artículo:** enfoque en el tema, la utilidad y lo que aprenderá el lector

## Instrucciones de despliegue

Incluir README con pasos para subir a GitHub, desplegar en Vercel y configurar la variable de entorno OPENAI_API_KEY.
