export default function handler(req, res) {
    res.status(200).json({
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        allKeys: Object.keys(process.env).filter(k => k.includes('API') || k.includes('OPENAI') || k.includes('GEMINI'))
    });
}
