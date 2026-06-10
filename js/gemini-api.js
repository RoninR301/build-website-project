const GEMINI_API_BASE =
    "https://generativelanguage.googleapis.com/v1beta/models";

function getGeminiModel() {
    const modelSelect = document.getElementById("modelSelect");
    return modelSelect?.value || "gemini-2.0-flash";
}

function buildGeminiUrl(model) {
    return `${GEMINI_API_BASE}/${model}:generateContent`;
}

function saveGeminiKey(apiKey) {
    localStorage.setItem("gemini_api_key", apiKey);
}

function getGeminiKey() {
    return localStorage.getItem("gemini_api_key");
}

function maskApiKey(apiKey) {
    if (!apiKey) return "missing";
    if (apiKey.length <= 8) return `present (${apiKey.length} chars)`;
    return `present (${apiKey.length} chars, ${apiKey.slice(0, 4)}...${apiKey.slice(-4)})`;
}

function formatGeminiError(status, statusText, bodyText, parsed) {
    const geminiMessage =
        parsed?.error?.message ||
        parsed?.error?.status ||
        parsed?.message ||
        null;

    const parts = [`HTTP ${status}${statusText ? ` ${statusText}` : ""}`];

    if (geminiMessage) {
        parts.push(geminiMessage);
    }

    if (bodyText && !geminiMessage) {
        parts.push(bodyText.slice(0, 500));
    } else if (bodyText && geminiMessage && !bodyText.includes(geminiMessage)) {
        parts.push(bodyText.slice(0, 300));
    }

    return parts.join(" — ");
}

function extractCandidateText(data) {
    const candidate = data?.candidates?.[0];

    if (!candidate) {
        return {
            ok: false,
            reason: "No candidates in Gemini response",
            detail: JSON.stringify(data?.promptFeedback || data?.usageMetadata || "empty candidates array")
        };
    }

    if (candidate.finishReason && candidate.finishReason !== "STOP") {
        return {
            ok: false,
            reason: `Generation stopped: ${candidate.finishReason}`,
            detail: JSON.stringify(candidate.safetyRatings || candidate)
        };
    }

    const parts = candidate?.content?.parts;
    if (!parts || parts.length === 0) {
        return {
            ok: false,
            reason: "Candidate has no content.parts",
            detail: JSON.stringify(candidate)
        };
    }

    const text = parts[0]?.text;
    if (typeof text !== "string" || text.trim() === "") {
        return {
            ok: false,
            reason: "Candidate part has no text",
            detail: JSON.stringify(parts[0] || {})
        };
    }

    return { ok: true, text };
}

function logGeminiDebug(step, details) {
    const line = `[Gemini ${step}] ${details}`;
    console.log(line);

    if (typeof logGeminiPipelineStep === "function") {
        logGeminiPipelineStep(step, details);
    }
}

async function sendToGemini(prompt) {
    const apiKey = getGeminiKey();
    const model = getGeminiModel();
    const requestUrl = buildGeminiUrl(model);
    const urlWithKey = `${requestUrl}?key=${encodeURIComponent(apiKey || "")}`;

    logGeminiDebug("STEP 1", `Prompt received (${prompt.length} chars)`);
    logGeminiDebug("CONFIG", `Model: ${model}`);
    logGeminiDebug("CONFIG", `API key: ${maskApiKey(apiKey)}`);
    logGeminiDebug("CONFIG", `Request URL: ${requestUrl}?key=<redacted>`);

    if (!apiKey) {
        const message = "Gemini API Key Not Found";
        logGeminiDebug("ERROR", message);
        return { success: false, message, step: "api_key_check" };
    }

    let response;
    let rawBody = "";

    try {
        logGeminiDebug("STEP 2", "Sending fetch() to Gemini API");

        response = await fetch(urlWithKey, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }]
                    }
                ]
            })
        });

        logGeminiDebug("STEP 2", "fetch() completed");

        rawBody = await response.text();

        logGeminiDebug("STEP 3", `HTTP status: ${response.status} ${response.statusText || ""}`);
        logGeminiDebug("STEP 4", `Raw body (${rawBody.length} chars): ${rawBody.slice(0, 800)}`);

    } catch (error) {
        const message = `Network error calling Gemini: ${error.message}`;
        console.error("[Gemini ERROR]", error);
        logGeminiDebug("ERROR", message);
        logGeminiDebug("ERROR", `Error object: ${error.stack || error.message}`);

        return {
            success: false,
            message,
            step: "fetch",
            error: error.message
        };
    }

    let data = null;

    try {
        data = rawBody ? JSON.parse(rawBody) : null;
        logGeminiDebug("STEP 5", `Parsed JSON: ${data ? "yes" : "empty body"}`);
    } catch (parseError) {
        const message = formatGeminiError(
            response.status,
            response.statusText,
            rawBody,
            null
        ) + ` — Invalid JSON: ${parseError.message}`;

        console.error("[Gemini ERROR] JSON parse failed:", parseError, rawBody);
        logGeminiDebug("ERROR", message);

        return {
            success: false,
            message,
            step: "parse_json",
            httpStatus: response.status,
            rawBody: rawBody.slice(0, 1000)
        };
    }

    if (!response.ok) {
        const message = formatGeminiError(
            response.status,
            response.statusText,
            rawBody,
            data
        );

        console.error("[Gemini ERROR] HTTP error:", response.status, data);
        logGeminiDebug("ERROR", message);
        logGeminiDebug("ERROR", `Gemini error object: ${JSON.stringify(data?.error || data)}`);

        return {
            success: false,
            message,
            step: "http_error",
            httpStatus: response.status,
            geminiError: data?.error || data,
            rawBody: rawBody.slice(0, 1000)
        };
    }

    if (data?.error) {
        const message = formatGeminiError(
            data.error.code || response.status,
            data.error.status || "",
            rawBody,
            data
        );

        console.error("[Gemini ERROR] Gemini error field:", data.error);
        logGeminiDebug("ERROR", message);

        return {
            success: false,
            message,
            step: "gemini_error",
            httpStatus: response.status,
            geminiError: data.error,
            rawBody: rawBody.slice(0, 1000)
        };
    }

    const extracted = extractCandidateText(data);

    if (!extracted.ok) {
        const message = `${extracted.reason}${extracted.detail ? ` — ${extracted.detail}` : ""}`;
        console.error("[Gemini ERROR] Candidate extraction failed:", extracted);
        logGeminiDebug("ERROR", message);
        logGeminiDebug("STEP 5", `Parse result: FAILED — ${extracted.reason}`);

        return {
            success: false,
            message,
            step: "candidate_extraction",
            httpStatus: response.status,
            parsed: data,
            rawBody: rawBody.slice(0, 1000)
        };
    }

    logGeminiDebug("STEP 5", `Parse result: OK (${extracted.text.length} chars)`);

    return {
        success: true,
        response: extracted.text,
        httpStatus: response.status,
        model,
        rawBody: rawBody.slice(0, 500)
    };
}
