import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { generateLatex } from "@/utils";
import { GenerateBody, Provider } from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemPrompt } from "../../../../config";

export const runtime = "nodejs";

export async function POST(req: Request) {
	try {
		console.log("[generate] Request received");
		const body = (await req.json()) as Partial<GenerateBody>;

		if (!body || !body.jd || !body.provider || !body.cv) {
			console.warn("[generate] Missing jd, provider, or cv in body");
			return NextResponse.json(
				{ error: "Missing 'jd', 'provider', or 'cv' in request body" },
				{ status: 400 }
			);
		}

		const SYSTEM_PROMPT = getSystemPrompt(!!body?.allowBold);

		const provider: Provider = (body.provider as Provider) ?? "openai";
		console.log("[generate] Allow Bold:", !!body?.allowBold);
		console.log("[generate] Using provider:", provider);

		const user = [
			"Here is the base CV data:",
			JSON.stringify(body.cv, null, 2),
			"",
			"Here is the target job description:",
			body.jd,
			"",
			"Generate the ATS-optimized JSON response with updated summary, skills (categorized), and experience bullets.",
		].join("\n");

		let responseText: string = "";

		if (provider === "openai") {
			console.log("[generate] Calling OpenAI");
			const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
			if (!client.apiKey) {
				console.error("[generate] OPENAI_API_KEY not set");
				return NextResponse.json(
					{ error: "OPENAI_API_KEY is not set" },
					{ status: 500 }
				);
			}
			const completion = await client.chat.completions.create({
				model: "gpt-4o-mini",
				temperature: 0.3,
				response_format: { type: "json_object" },
				messages: [
					{ role: "system", content: SYSTEM_PROMPT },
					{ role: "user", content: user },
				],
			});
			responseText = completion.choices[0]?.message?.content?.trim() || "";
		} else if (provider === "claude") {
			console.log("[generate] Calling Anthropic Claude");
			const anthropic = new Anthropic({
				apiKey: process.env.ANTHROPIC_API_KEY,
			});
			if (!anthropic.apiKey) {
				console.error("[generate] ANTHROPIC_API_KEY not set");
				return NextResponse.json(
					{ error: "ANTHROPIC_API_KEY is not set" },
					{ status: 500 }
				);
			}
			const msg = await anthropic.messages.create({
				model: "claude-3-7-sonnet-20250219",
				max_tokens: 4000,
				temperature: 0.3,
				system: SYSTEM_PROMPT,
				messages: [{ role: "user", content: user }],
			});

			responseText = msg.content
				.filter((c: any) => c.type === "text")
				.map((c: any) => c.text)
				.join("");
		} else if (provider === "gemini") {
			console.log("[generate] Calling Google Gemini");
			const apiKey = process.env.GOOGLE_API_KEY;
			if (!apiKey) {
				console.error("[generate] GOOGLE_API_KEY not set");
				return NextResponse.json(
					{ error: "GOOGLE_API_KEY is not set" },
					{ status: 500 }
				);
			}
			const genAI = new GoogleGenerativeAI(apiKey);
			const model = genAI.getGenerativeModel({
				model: "gemini-1.5-pro",
				generationConfig: {
					temperature: 0.3,
					responseMimeType: "application/json",
				},
			});
			const prompt = [SYSTEM_PROMPT, "\n\n", user].join("");
			const resp = await model.generateContent(prompt);
			responseText = resp.response.text();
		}

		// Clean up response text to ensure it's valid JSON
		responseText = responseText.trim();
		if (responseText.startsWith("```json")) {
			responseText = responseText.slice(7);
		}
		if (responseText.startsWith("```")) {
			responseText = responseText.slice(3);
		}
		if (responseText.endsWith("```")) {
			responseText = responseText.slice(0, -3);
		}
		responseText = responseText.trim();

		// Parse the JSON to validate it
		let optimizedData;
		try {
			optimizedData = JSON.parse(responseText);
		} catch (e) {
			console.error(
				"[generate] Failed to parse AI response as JSON:",
				responseText
			);
			return NextResponse.json(
				{ error: "AI did not return valid JSON" },
				{ status: 502 }
			);
		}

		// Generate LaTeX using the optimized data and original CV data
		const latex = generateLatex(optimizedData);

		console.log("[generate] Successfully generated optimized data and LaTeX");
		return NextResponse.json({
			latex,
			optimizedData, // Also return this for debugging/preview
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("[generate] Error:", message);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
