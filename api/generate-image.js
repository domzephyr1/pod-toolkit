export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_AI_KEY || process.env.OPEN_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'OPENAI API Key is missing.' });
    }

    const prompt = req.body?.prompt;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    try {
        let response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-image-2',
                prompt: prompt,
                n: 1,
                size: '1024x1024'
            })
        });

        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`OpenAI API error: ${errData}`);
        }

        const data = await response.json();
        
        let imageUrl = data.data[0].url;
        
        // gpt-image-2 defaults to b64_json instead of url
        if (!imageUrl && data.data[0].b64_json) {
            imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
        }
        
        if (!imageUrl) {
            throw new Error('No image URL or base64 data returned from OpenAI.');
        }

        res.status(200).json({ url: imageUrl });

    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({ error: error.message });
    }
}
