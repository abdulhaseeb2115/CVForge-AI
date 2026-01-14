const express = require("express");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { mkdtemp, rm } = require("fs/promises");
const { spawn } = require("child_process");

async function runPdflatex(workingDir) {
	await new Promise((resolve, reject) => {
		const child = spawn(
			"pdflatex",
			["-interaction=nonstopmode", "-halt-on-error", "main.tex"],
			{ cwd: workingDir }
		);
		let stderr = "";
		let stdout = "";
		child.stderr.on("data", (d) => {
			stderr += String(d);
		});
		child.stdout.on("data", (d) => {
			stdout += String(d);
		});
		child.on("close", (code) => {
			if (code === 0) resolve();
			else {
				console.error("[latex-server] pdflatex stdout:", stdout);
				console.error("[latex-server] pdflatex stderr:", stderr);
				reject(
					new Error(`pdflatex exited with code ${code}: ${stderr || stdout}`)
				);
			}
		});
		child.on("error", (err) => reject(err));
	});
}

const app = express();
app.use(express.json({ limit: "5mb" }));

// Add error handling for JSON parsing
app.use((error, req, res, next) => {
	if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
		console.error("[latex-server] JSON parsing error:", error.message);
		return res.status(400).json({ error: "Invalid JSON in request body" });
	}
	next(error);
});

app.post("/compile", async (req, res) => {
	let tmpDir = "";
	try {
		console.log("[latex-server] /compile called");
		console.log("[latex-server] Request body type:", typeof req.body);
		console.log(
			"[latex-server] Request body keys:",
			Object.keys(req.body || {})
		);
		console.log(
			"[latex-server] Raw body preview:",
			JSON.stringify(req.body).substring(0, 200) + "..."
		);
		const latex = req.body && req.body.latex;
		if (!latex || typeof latex !== "string") {
			console.warn("[latex-server] Missing latex in body");
			return res.status(400).json({ error: "Missing 'latex' in request body" });
		}
		tmpDir = await mkdtemp(path.join(os.tmpdir(), "latex-"));
		console.log("[latex-server] Created tmp dir", tmpDir);
		const texPath = path.join(tmpDir, "main.tex");
		await fs.writeFile(texPath, latex, "utf8");
		console.log("[latex-server] Wrote main.tex");

		console.log("[latex-server] Running pdflatex (1/2)");
		await runPdflatex(tmpDir);
		console.log("[latex-server] Running pdflatex (2/2)");
		await runPdflatex(tmpDir);

		const pdfPath = path.join(tmpDir, "main.pdf");
		const pdfBuffer = await fs.readFile(pdfPath);
		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", "inline; filename=CV.pdf");
		res.setHeader("Cache-Control", "no-store");
		console.log("[latex-server] Returning PDF");
		return res.status(200).send(pdfBuffer);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		console.error("[latex-server] Error:", message);
		return res.status(500).json({ error: message });
	} finally {
		if (tmpDir) {
			try {
				await rm(tmpDir, { recursive: true, force: true });
				console.log("[latex-server] Cleaned up tmp dir");
			} catch {}
		}
	}
});

app.get("/health", async (req, res) => {
	try {
		console.log("[latex-server] /health called");
		return res.status(200).json({ message: "OK" });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		console.error("[latex-server] Error:", message);
		return res.status(500).json({ error: message });
	}
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
	console.log(`LaTeX compile server listening on :${port}`);
});
