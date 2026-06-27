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
                model: 'dall-e-3',
                prompt: prompt,
                n: 1,
                size: '1024x1024'
            })
        });

        // Fallback to dall-e-2 if the user's API tier doesn't support dall-e-3
        if (response.status === 400) {
            const errorClone = await response.clone().json();
            if (errorClone.error && errorClone.error.message.includes('does not exist')) {
                console.log("Falling back to dall-e-2...");
                response = await fetch('https://api.openai.com/v1/images/generations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'dall-e-2',
                        prompt: prompt,
                        n: 1,
                        size: '1024x1024'
                    })
                });
            }
        }

        if (!response.ok) {
            const errData = await response.text();
            throw new Error(`OpenAI DALL-E API error: ${errData}`);
        }

        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            throw new Error('No image returned from OpenAI.');
        }

        res.status(200).json({ url: data.data[0].url });

    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({ error: error.message });
    }
}
