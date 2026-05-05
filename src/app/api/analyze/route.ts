import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { readFile } from 'fs/promises';
import path from 'path';

// Initialize OpenAI client. It will automatically use the OPENAI_API_KEY env variable.
const openai = new OpenAI();

// --- SEO Rules: read from seo-rules.md and cache at module load ---
let cachedSeoRules: string | null = null;

async function getSeoRules(): Promise<string> {
  if (cachedSeoRules) return cachedSeoRules;

  const filePath = path.join(process.cwd(), 'seo-rules.md');
  try {
    cachedSeoRules = await readFile(filePath, 'utf-8');
    console.log(`[SEO Rules] Loaded ${cachedSeoRules.length} chars from seo-rules.md`);
    return cachedSeoRules;
  } catch (error) {
    console.error('[SEO Rules] Error reading seo-rules.md:', error);
    throw new Error('No se pudo cargar el archivo seo-rules.md');
  }
}

function buildSystemPrompt(seoRules: string): string {
  return `Eres un SEO Manager Senior y Experto en Copywriting de Respuesta Directa (Direct Response). Tu objetivo es generar Títulos y Meta Descripciones optimizados para la página web que se te proporcionará, aplicando técnicas avanzadas de psicología de ventas y SEO técnico.

A continuación tienes el documento completo con todas las reglas SEO que DEBES seguir estrictamente:

---
${seoRules}
---

FORMATO DE SALIDA ESTRICTO (No incluyas markdown, introducciones, conclusiones ni explicaciones extra. Solo lo que sigue):

Variante 1:
Título: [Tu título]
Descripción: [Tu descripción]

Variante 2:
Título: [Tu título]
Descripción: [Tu descripción]

Variante 3:
Título: [Tu título]
Descripción: [Tu descripción]

REGLAS CRÍTICAS DE FORMATO:
- Sigue TODAS las reglas del documento anterior sin excepción.
- Verifica internamente que cada título y descripción cumpla los límites de caracteres, pero NUNCA incluyas el conteo de caracteres en el texto de salida.
- NO añadas "(X caracteres)", "[X caracteres]" ni ninguna indicación de longitud en los títulos ni en las descripciones.
- Devuelve SOLO el texto limpio de cada título y descripción, sin anotaciones, sin paréntesis con conteos, sin explicaciones.
- No incluyas nada más que las 3 variantes en el formato exacto indicado arriba.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'Falta la URL en la petición' }, { status: 400 });
    }

    // 0. Load SEO rules
    let seoRules: string;
    try {
      seoRules = await getSeoRules();
    } catch {
      return NextResponse.json({ error: 'Error interno: no se pudieron cargar las reglas SEO' }, { status: 500 });
    }

    // 1. Fetch HTML content
    let html = '';
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'es-ES,es;q=0.9',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      html = await response.text();
    } catch (error) {
      console.error('Error fetching URL:', error);
      return NextResponse.json({ error: 'No se ha podido acceder a la URL' }, { status: 500 });
    }

    // 2. Extract content with cheerio
    const $ = cheerio.load(html);
    
    // Remove scripts and styles
    $('script, style, noscript, iframe, svg').remove();

    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
    const h1 = $('h1').first().text().trim();
    
    // Extract early paragraphs for context (max 1000 chars roughly)
    let paragraphs = '';
    $('p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) {
         paragraphs += text + ' ';
      }
      if (paragraphs.length > 1000) return false; // Break loop
    });

    const pageContext = `
Título actual: ${title}
Meta descripción actual: ${metaDescription}
H1 principal: ${h1}
Contenido principal extraído: ${paragraphs.substring(0, 1500)}
    `;

    // 3. Call OpenAI with the dynamically built system prompt
    try {
      const systemPrompt = buildSystemPrompt(seoRules);

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analiza esta URL y genera los títulos y descripciones SEO según las reglas.\n\nURL: ${url}\n\nContexto extraído de la página:\n${pageContext}` }
        ],
        model: "gpt-4o-mini",
        temperature: 0.7, // A bit of creativity for the copywriting aspect
      });

      const generatedText = completion.choices[0].message.content;

      if (!generatedText) {
          throw new Error('No content received from OpenAI');
      }

      // Parse the output string into an array of objects
      const variants = parseVariants(generatedText);

      return NextResponse.json({ variants });

    } catch (error: any) {
        console.error('OpenAI Error:', error);
        return NextResponse.json({ error: 'Error al generar las variantes con IA' }, { status: 500 });
    }

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Strip any "(XX caracteres)" or similar annotations the model might add
function cleanCharCount(text: string): string {
    return text
        .replace(/\s*\(\d+\s*caracteres\)/gi, '')
        .replace(/\s*\[\d+\s*caracteres\]/gi, '')
        .replace(/\s*—\s*\d+\s*caracteres$/gi, '')
        .replace(/\s*-\s*\d+\s*caracteres$/gi, '')
        .trim();
}

// Helper function to parse the strictly formatted text from OpenAI into a structured JSON
function parseVariants(text: string) {
    const variants: { title: string, description: string }[] = [];
    const blocks = text.split(/Variante \d+:/).filter(block => block.trim() !== '');

    blocks.forEach(block => {
        const titleMatch = block.match(/Título:\s*(.+)/i);
        const descMatch = block.match(/Descripción:\s*([\s\S]+?)(?=\n\n|$)/i);

        if (titleMatch && descMatch) {
            variants.push({
                title: cleanCharCount(titleMatch[1].trim()),
                description: cleanCharCount(descMatch[1].trim().replace(/\n/g, ' '))
            });
        }
    });

    // Fallback if regex fails (shouldn't happen with strict prompt, but just in case)
    if (variants.length === 0) {
        console.warn("Could not parse variants. Raw text:", text);
        // We could just return raw text, but let's try to handle it in the frontend
        throw new Error("Formato de respuesta de IA inválido");
    }

    return variants;
}
