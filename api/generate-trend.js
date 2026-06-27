export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Fallback to OPENAI_AI_KEY or OPEN_API_KEY just in case it was entered with a typo in Vercel
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_AI_KEY || process.env.OPEN_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'OPENAI_API_KEY environment variable is missing.' });
    }

    const count = req.body && req.body.count ? parseInt(req.body.count, 10) : 30;
    const imageContext = req.body && req.body.imageContext ? req.body.imageContext : null;

    let systemPrompt = `You are an expert Print-on-Demand e-commerce researcher and Art Director.
Your task is to identify a highly profitable, trending niche (e.g., hobbies, careers, dog breeds, introverts).
Generate a short text template for a t-shirt design with ONE variable placeholder, like "WORLD'S OKAYEST {role}" or "DON'T TALK TO ME, I'M RECHARGING FROM {social_event}".
Then, provide a list of exactly ${count} unique, highly relatable values for that variable.`;

    if (imageContext) {
        systemPrompt += `\n\nCRITICAL CONTEXT: The user is building a design around this specific imagery: "${imageContext}". You MUST ensure your chosen niche, template, and values perfectly match this visual theme.`;
    }

    systemPrompt += `\n\nYou must also act as the Art Director and choose the visual styling that best fits the niche.
Available fonts: "Anton", "Bebas Neue", "Archivo Black", "Bungee", "Playfair Display", "DM Serif Display", "Abril Fatface", "Fraunces", "Space Grotesk", "Caveat", "Permanent Marker", "Shrikhand".
Available graphics: "skull", "distress", "eagle", "lightning", "coffee", "rose", "none".

You MUST return ONLY a JSON object with these exact keys:
- "template" (string): The text template containing the {placeholder}.
- "values" (array of strings): Exactly ${count} values for the placeholder.
- "imagePrompt" (string): A highly detailed DALL-E 3 prompt to generate the perfect centerpiece graphic for this exact niche. (e.g., "A highly detailed vector illustration of a...")
- "design" (object) containing:
    - "fontFamily" (string): Best matching font from the available list.
    - "textColor" (string): Hex color code for the text.
    - "graphicType" (string): Best matching background graphic from the available list.
    - "graphicColor" (string): Hex color code for the graphic.
    - "altFontEnabled" (boolean): True if you want a dual-font contrast hierarchy, False for uniform font.
    - "align" (string): "center", "left", or "right".
    - "transform" (string): "uppercase", "capitalize", or "none".`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: `Generate a new trending POD design template and ${count} variations.`
                    }
                ]
            })
        });

        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`OpenAI API error: ${errData}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Ensure it's valid JSON
        const parsed = JSON.parse(content);
        
        if (!parsed.template || !Array.isArray(parsed.values)) {
            throw new Error('Invalid JSON structure returned by AI.');
        }

        res.status(200).json(parsed);

    } catch (error) {
        console.error('Error generating trend:', error);
        res.status(500).json({ error: error.message });
    }
}
