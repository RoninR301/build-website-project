const GEMINI_API_URL =
"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function saveGeminiKey(
apiKey
) {

localStorage.setItem(
    "gemini_api_key",
    apiKey
);

}

function getGeminiKey() {

return localStorage.getItem(
    "gemini_api_key"
);

}

async function sendToGemini(
prompt
) {

const apiKey =
getGeminiKey();

if (!apiKey) {

    return {
        success: false,
        message:
        "Gemini API Key Not Found"
    };
}

try {

    const response =
    await fetch(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

                contents: [
                    {
                        parts: [
                            {
                                text:
                                prompt
                            }
                        ]
                    }
                ]

            })
        }
    );

    const data =
    await response.json();

    const text =
    data?.candidates?.[0]
    ?.content?.parts?.[0]
    ?.text ||
    "No Response";

    return {

        success: true,

        response: text
    };

} catch (error) {

    console.error(
        error
    );

    return {

        success: false,

        message:
        error.message
    };
}

}