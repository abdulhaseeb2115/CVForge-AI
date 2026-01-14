"use client";

import dynamic from "next/dynamic";
import { generateLatex } from "../utils";
import { DEFAULT_CV } from "../../config";
import { CompileBody, CV, GenerateBody, Provider } from "../types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
	ssr: false,
});

export default function Home() {
	const [cvJson, setCvJson] = useState<string>(
		JSON.stringify(DEFAULT_CV, null, 2)
	);
	const [jd, setJd] = useState<string>("");
	const [allowBold, setAllowBold] = useState<boolean>(false);
	const [provider, setProvider] = useState<Provider>("claude");
	const [latex, setLatex] = useState<string>(generateLatex(DEFAULT_CV));
	const [pdfUrl, setPdfUrl] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);
	const [compiling, setCompiling] = useState<boolean>(false);
	const [error, setError] = useState<string>("");
	const [showLatexEditor, setShowLatexEditor] = useState<boolean>(false);
	const compileTimer = useRef<number | null>(null);
	const heroRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLDivElement>(null);

	const safeParse = useCallback((text: string): CV | null => {
		try {
			return JSON.parse(text) as CV;
		} catch {
			return null;
		}
	}, []);

	const generate = useCallback(async () => {
		console.log("[ui] Generate clicked");

		if (!jd.trim()) {
			setError("Please enter a job description");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const cv = safeParse(cvJson);
			if (!cv) {
				console.warn("[ui] CV JSON invalid");
				throw new Error("CV JSON is invalid. Please check the format.");
			}

			const body: GenerateBody = {
				cv,
				jd,
				allowBold,
				provider,
			};

			const res = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const data = await res.json();

			if (!res.ok) {
				console.error("[ui] Generate failed", data);
				throw new Error(data?.error || "Failed to generate optimized CV");
			}

			setLatex(String(data.latex));
			if (data.optimizedData) {
				console.log("Optimized Data:", data.optimizedData);
			}
			console.log("[ui] LaTeX set (length)", String(data.latex).length);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	}, [cvJson, jd, provider, safeParse, allowBold]);

	const compile = useCallback(async (source: string) => {
		// Don't compile if it's just the placeholder text
		if (source.includes("Click 'Generate ATS-Optimized CV'")) {
			return;
		}

		console.log("[ui] Compile triggered (debounced)", source.length);
		setCompiling(true);
		setError("");

		try {
			const body: CompileBody = { latex: source };

			const res = await fetch("/api/compile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				console.error("[ui] Compile failed", data);
				throw new Error(data?.error || "Failed to compile LaTeX");
			}

			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			setPdfUrl((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return url;
			});
			console.log("[ui] PDF URL set");
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Unknown error");
		} finally {
			setCompiling(false);
		}
	}, []);

	const debouncedCompile = useMemo(() => {
		return (source: string) => {
			if (compileTimer.current) window.clearTimeout(compileTimer.current);
			compileTimer.current = window.setTimeout(() => compile(source), 800);
		};
	}, [compile]);

	const downloadPdf = useCallback(async () => {
		if (!pdfUrl) return;
		const a = document.createElement("a");
		a.href = pdfUrl;
		a.download = "CV_ATS_Optimized.pdf";
		a.click();
		console.log("[ui] Download clicked");
	}, [pdfUrl]);

	const scrollToInput = () => {
		inputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	useEffect(() => {
		console.log("[ui] Effect: compile on latex change");
		if (latex && !latex.includes("Click 'Generate ATS-Optimized CV'")) {
			debouncedCompile(latex);
		}
		return () => {
			if (compileTimer.current) window.clearTimeout(compileTimer.current);
		};
	}, [latex, debouncedCompile]);

	useEffect(() => {
		return () => {
			if (pdfUrl) URL.revokeObjectURL(pdfUrl);
		};
	}, []);

	return (
		<div className="min-h-screen flex flex-col bg-[#f8f9fa]">
			{/* Subtle background gradient animation */}
			<div className="fixed inset-0 -z-10 animate-gradient bg-gradient-to-br from-[#f8f9fa] via-[#ffffff] to-[#f0f4f8]" />

			{/* Hero Section */}
			<section
				ref={heroRef}
				className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
			>
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 animate-fade-in-up">
						<span className="bg-gradient-to-r from-[#1a1f3a] to-[#2d3748] bg-clip-text text-transparent">
							CVForge AI
						</span>
					</h1>
					<p
						className="text-lg sm:text-xl text-[#64748b] mb-2 animate-fade-in-up opacity-0"
						style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
					>
						Precision-tailored resumes, powered by AI and LaTeX.
					</p>
					<p
						className="text-base text-[#64748b] mb-8 max-w-2xl mx-auto animate-fade-in-up opacity-0"
						style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
					>
						Transform your CV into an ATS-optimized, job-tailored document with
						the precision of LaTeX and the intelligence of AI.
					</p>
					<button
						onClick={scrollToInput}
						className="px-8 py-3 bg-gradient-to-r from-[#1a1f3a] to-[#2d3748] text-white rounded-lg font-medium hover:from-[#141829] hover:to-[#1a1f3a] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 animate-fade-in-up opacity-0"
						style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}
					>
						Start Optimizing
					</button>
				</div>
			</section>

			{/* Input Section */}
			<section ref={inputRef} className="py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto">
					<h2 className="text-3xl font-bold text-[#1a1f3a] mb-8 text-center">
						Provide Your Inputs
					</h2>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
						{/* Left: CV JSON Editor */}
						<div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
							<label className="block text-sm font-semibold text-[#1a1f3a] mb-3">
								Profile JSON
							</label>
							<textarea
								className="w-full border border-gray-200 rounded-lg p-4 font-mono text-sm h-80 focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent transition-all duration-200 resize-none"
								spellCheck={false}
								value={cvJson}
								onChange={(e) => setCvJson(e.target.value)}
								placeholder="Enter your CV JSON here..."
							/>
						</div>

						{/* Right: Job Description */}
						<div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
							<label className="block text-sm font-semibold text-[#1a1f3a] mb-3">
								Job Description
							</label>
							<textarea
								className="w-full border border-gray-200 rounded-lg p-4 text-sm h-80 focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent transition-all duration-200 resize-none"
								value={jd}
								onChange={(e) => setJd(e.target.value)}
								placeholder="Paste the job description here..."
							/>
						</div>
					</div>

					{/* Settings and Generate Button */}
					<div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
							<div className="flex flex-col sm:flex-row sm:items-center gap-4">
								<div className="flex items-center gap-4">
									<span className="text-sm font-medium text-[#1a1f3a]">
										LLM Provider:
									</span>
									<div className="flex items-center gap-3">
										<label className="text-sm flex items-center gap-2 cursor-pointer">
											<input
												type="radio"
												name="provider"
												value="openai"
												checked={provider === "openai"}
												onChange={() => setProvider("openai")}
												className="w-4 h-4 text-[#06b6d4] focus:ring-[#06b6d4]"
											/>
											<span className="text-[#64748b]">OpenAI</span>
										</label>
										<label className="text-sm flex items-center gap-2 cursor-pointer">
											<input
												type="radio"
												name="provider"
												value="claude"
												checked={provider === "claude"}
												onChange={() => setProvider("claude")}
												className="w-4 h-4 text-[#06b6d4] focus:ring-[#06b6d4]"
											/>
											<span className="text-[#64748b]">Claude</span>
										</label>
										<label className="text-sm flex items-center gap-2 cursor-pointer">
											<input
												type="radio"
												name="provider"
												value="gemini"
												checked={provider === "gemini"}
												onChange={() => setProvider("gemini")}
												className="w-4 h-4 text-[#06b6d4] focus:ring-[#06b6d4]"
											/>
											<span className="text-[#64748b]">Gemini</span>
										</label>
									</div>
								</div>

								<div className="flex items-center gap-2">
									<label className="text-sm flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											name="allowBold"
											checked={allowBold}
											onChange={() => setAllowBold((prev) => !prev)}
											className="w-4 h-4 text-[#06b6d4] rounded focus:ring-[#06b6d4]"
										/>
										<span className="text-[#64748b] font-medium">
											Keyword Highlight
										</span>
									</label>
								</div>
							</div>

							<button
								onClick={generate}
								disabled={loading}
								className="px-6 py-2.5 bg-gradient-to-r from-[#1a1f3a] to-[#2d3748] text-white rounded-lg font-medium hover:from-[#141829] hover:to-[#1a1f3a] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-md"
							>
								{loading ? "Generating..." : "Generate ATS-Optimized CV"}
							</button>
						</div>
						{error && (
							<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
								<p className="text-red-600 text-sm">Error: {error}</p>
							</div>
						)}
					</div>
				</div>
			</section>

			{/* Output Section */}
			<section className="py-12 px-4 sm:px-6 lg:px-8 flex-1">
				<div className="max-w-7xl mx-auto">
					<h2 className="text-3xl font-bold text-[#1a1f3a] mb-8 text-center">
						Optimized CV Preview
					</h2>

					<div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
						<div className="flex items-center justify-between mb-4">
							<div className="text-sm text-[#64748b]">
								{compiling && "Compiling PDF..."}
							</div>
							<div className="flex items-center gap-3">
								<button
									onClick={() => compile(latex)}
									className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-[#64748b] hover:bg-gray-50 transition-colors duration-200"
								>
									Recompile
								</button>
								<button
									onClick={downloadPdf}
									disabled={!pdfUrl}
									className="px-4 py-2 bg-gradient-to-r from-[#1a1f3a] to-[#2d3748] text-white rounded-lg text-sm font-medium hover:from-[#141829] hover:to-[#1a1f3a] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
								>
									Download PDF
								</button>
								<button
									onClick={() => setShowLatexEditor(!showLatexEditor)}
									className="px-4 py-2 text-sm text-[#64748b] hover:text-[#1a1f3a] transition-colors duration-200"
								>
									{showLatexEditor ? "Hide" : "Show"} LaTeX Editor
								</button>
							</div>
						</div>

						{showLatexEditor && (
							<div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
								<div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
									<h3 className="text-sm font-semibold text-[#1a1f3a]">
										LaTeX Editor
									</h3>
								</div>
								<div className="h-96">
									<MonacoEditor
										height="100%"
										defaultLanguage="latex"
										theme="vs-light"
										value={latex}
										onChange={(v) => setLatex(v ?? "")}
										options={{
											fontSize: 11,
											minimap: { enabled: false },
											wordWrap: "on",
											scrollBeyondLastLine: false,
											automaticLayout: true,
										}}
										onMount={(editor, monaco) => {
											const langs =
												(monaco.languages as any).getLanguages?.() ?? [];
											if (!langs.some((l: any) => l.id === "latex")) {
												monaco.languages.register({ id: "latex" });
											}
											(monaco.languages as any).setMonarchTokensProvider(
												"latex",
												{
													tokenizer: {
														root: [
															[/\\\\[a-zA-Z@]+\*?/, "keyword"],
															[/%.*/, "comment"],
															[/\{[^}]*\}/, "string"],
														],
													},
												}
											);
										}}
									/>
								</div>
							</div>
						)}

						<div className="bg-gray-50 rounded-lg min-h-[600px] border border-gray-200 overflow-hidden">
							{pdfUrl ? (
								<iframe
									title="PDF Preview"
									src={pdfUrl}
									className="w-full h-full min-h-[600px] border-0"
								/>
							) : (
								<div className="flex items-center justify-center h-full min-h-[600px]">
									<div className="text-center">
										<p className="text-[#64748b] text-sm mb-2">
											{compiling
												? "Compiling your CV..."
												: "PDF will appear here after generation"}
										</p>
										{compiling && (
											<div className="flex justify-center mt-4">
												<div className="w-8 h-8 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin"></div>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* Footer Section */}
			<footer className="bg-[#1a1f3a] text-white py-12 px-4 sm:px-6 lg:px-8 mt-auto">
				<div className="max-w-4xl mx-auto text-center">
					<h3 className="text-2xl font-bold mb-4">CVForge AI</h3>
					<p className="text-gray-300 mb-2 max-w-2xl mx-auto">
						CVForge AI helps developers and professionals generate ATS-friendly,
						job-optimized resumes using AI and LaTeX precision.
					</p>
					<p className="text-gray-400 text-sm mt-6">
						© {new Date().getFullYear()} CVForge AI. All rights reserved.
					</p>
				</div>
			</footer>
		</div>
	);
}
