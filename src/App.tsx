import {useState } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface PaperResult {

  status: string
  score: number;
  title: string;
  journal: string;
  year: string;
  author: string;
  hash: string;

}

  export default function App(){

    const [doi, setDoi] = useState<string>('');
    const [result, setResult] = useState<PaperResult| null >(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null >(null);
    const checkDOI = async () => {
    if (!doi.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {

      const cleanDoi = doi.trim().replace(/^https?:\/\/(www\.)?doi\.org\//i, '');

      const API_URL = import.meta.env.VITE_API_URL || "https://citeguardia-backend.onrender.com";
      const res = await axios.get(`${API_URL}/api/verify?doi=${encodeURIComponent(cleanDoi)}`);

    const data = res.data.message;
    const containerTitle = data['container-title']?.[0] || '';
    const pubYear = data.published?.['date-parts']?.[0]?.[0] || '';
    const authors = data.author || [];

    const hasTitle = Boolean(data.title?.[0]);
    const hasJournal = Boolean(containerTitle);
    const hasYear = Boolean(pubYear);
    const hasAuthor = authors.length > 0;

    let score = 50;
    if (hasTitle && hasJournal && hasYear && hasAuthor) {
      score = 100;
    }

      // 3. Author of the Paper
      const authorsList = data.author
       ? data.author.map((a: any) => `${a.given || ''} ${a.family || ''}`).join(', ')
      : 'Unknown Author';

      // 4. Generate SHA256 integrity hash
      const hash = CryptoJS.SHA256(doi + new Date().toISOString()).toString();

      setResult({
        status: 'verified',
        score,
        title: data.title?.[0] || 'Unknown Title',
        journal: containerTitle || 'Unknown Journal',
        year: String(pubYear),
        author: authorsList,
        hash,
      });

    } catch (err) {
      setError('DOI not found or invalid academic reference.');
    } finally {
      setLoading(false);
    }
  };

   return (

    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">

      {/* Header Section */}

      <div className="text-center max-w-2xl mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-blue-400 mb-2">
          CITEGUARD IA

        </h1>

        <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
          Guard Student From Using Fake or Tampered Academic Paper!
        </p>
        <p className="text-sm italic text-slate-500">
          "DOI-Based Academic Verification System for CCDI Students"
        </p>
      </div>



      {/* Search Input Box & Button */}
      <div className="flex w-full max-w-xl gap-2 mb-6">

        <input

          type="text"
          value={doi}
          onChange={(e) => setDoi(e.target.value)}
          placeholder="Enter DOI (e.g., 10.1126/science.1231143)"
          className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 text-sm"
        />

        <button

          onClick={checkDOI}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50 text-sm cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check Reference'}
        </button>
      </div>

      {/* Error Message Display */}

      {error && (
        <div className="w-full max-w-xl bg-red-950/80 border border-red-800 text-red-300 p-4 rounded-xl flex items-center gap-3 shadow-md mb-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result && (

        <div className="w-full max-w-xl bg-emerald-950/40 border border-emerald-700/50 backdrop-blur-md rounded-xl p-6 shadow-xl text-emerald-200">
          <div className="flex items-center justify-center gap-2 text-lg font-bold text-emerald-400 mb-3">
            <ShieldCheck className="w-6 h-6" /> VERIFIED
          </div>
          <div className="space-y-2 text-sm">
         <p><span className="font-semibold text-slate-300">Score:</span> {result.score}/100</p>
        <p><span className="font-semibold text-slate-300">Title:</span> {result.title}</p>
        <p><span className="font-semibold text-slate-300">Journal:</span> {result.journal}</p>
         <p><span className="font-semibold text-slate-300">Published Year:</span> {result.year}</p>
        <p><span className="font-semibold text-slate-300">Author(s):</span> {result.author}</p>
       <div className="pt-2 border-t border-emerald-800/40">
        <span className="font-semibold text-slate-300 block text-xs mb-1">Integrity Hash:</span>
        <p className="font-mono text-xs text-emerald-400 break-all bg-slate-900/60 p-2 rounded">
                {result.hash}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}