"use client";

import { useState } from "react";
import { Search, Copy, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

type Variant = {
  title: string;
  description: string;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError("Por favor, introduce una URL válida con http:// o https://");
      return;
    }

    setLoading(true);
    setError("");
    setVariants([]);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al analizar la URL");
      }

      setVariants(data.variants);
    } catch (err: any) {
      setError(err.message || "No se ha podido acceder a la URL");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const getCharCountColor = (count: number, max: number, min: number = 0) => {
    if (count > max) return "text-red-500 font-medium";
    if (count < min) return "text-amber-500 font-medium";
    return "text-emerald-600 font-medium";
  };

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 md:py-24">
      {/* Header Section */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
          SEO Copywriter <span className="text-indigo-600">Pro</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Genera títulos y descripciones magnéticas, diseñadas para captar el clic y dominar las SERPs.
        </p>
        <p className="text-sm text-slate-400">
          Creada por <span className="font-medium text-slate-500">Omar Pumariega</span>
        </p>
      </div>

      {/* Input Section */}
      <form onSubmit={handleAnalyze} className="relative max-w-2xl mx-auto mb-16 group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://tupagina.com/articulo"
          className="block w-full pl-12 pr-32 py-4 text-base bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          required
        />
        <button
          type="submit"
          disabled={loading || !url}
          className="absolute inset-y-2 right-2 flex items-center justify-center px-6 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Analizando
            </>
          ) : (
            "Analizar"
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {variants.length > 0 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold text-slate-900 border-b border-slate-200 pb-4">
            Variantes Generadas
          </h2>
          <div className="grid gap-6">
            {variants.map((variant, index) => {
              const types = ["Informativa", "Beneficio / Emoción", "Directa / CTA"];
              
              return (
                <div key={index} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      Opción {index + 1}: {types[index] || `Variante ${index + 1}`}
                    </span>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Título */}
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Título (Etiqueta Title)
                        </label>
                        <span className={`text-xs ${getCharCountColor(variant.title.length, 65, 30)}`}>
                          {variant.title.length} / 65
                        </span>
                      </div>
                      <div className="relative group">
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-900 font-medium pr-12 text-lg">
                          {variant.title}
                        </div>
                        <button
                          onClick={() => handleCopy(variant.title, `title-${index}`)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-md transition-colors"
                          title="Copiar título"
                        >
                          {copiedStates[`title-${index}`] ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Meta Descripción
                        </label>
                        <span className={`text-xs ${getCharCountColor(variant.description.length, 155, 70)}`}>
                          {variant.description.length} / 155
                        </span>
                      </div>
                      <div className="relative group">
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-700 pr-12 text-base leading-relaxed">
                          {variant.description}
                        </div>
                        <button
                          onClick={() => handleCopy(variant.description, `desc-${index}`)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-md transition-colors"
                          title="Copiar descripción"
                        >
                          {copiedStates[`desc-${index}`] ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
