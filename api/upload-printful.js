const { put } = require('@vercel/blob');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64Image, filename } = req.body;

    if (!base64Image || !filename) {
      return res.status(400).json({ error: 'Missing base64Image or filename' });
    }

    const printfulApiKey = process.env.PRINTFUL_API_KEY;
    if (!printfulApiKey) {
      return res.status(500).json({ error: 'PRINTFUL_API_KEY is not configured in Vercel.' });
    }

    // 1. Remove the data URI prefix (e.g., "data:image/png;base64,")
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // 2. Upload to Vercel Blob
    const blobName = `designs/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
    const blob = await put(blobName, buffer, {
      access: 'public',
      contentType: 'image/png'
    });

    const publicUrl = blob.url;

    // 3. Send to Printful API
    const printfulResponse = await fetch('https://api.printful.com/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${printfulApiKey}`
      },
      body: JSON.stringify({
        role: 'printfile',
        url: publicUrl,
        filename: filename
      })
    });

    const printfulData = await printfulResponse.json();

    if (!printfulResponse.ok) {
      return res.status(printfulResponse.status).json({ 
        error: 'Printful API Error', 
        details: printfulData 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully uploaded to Printful',
      blobUrl: publicUrl,
      printfulFileId: printfulData.result.id
    });

  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
