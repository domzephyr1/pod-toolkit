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

    // 2. Upload directly to Printful File Library via FormData
    const fileBlob = new Blob([buffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', fileBlob, filename);
    formData.append('role', 'print');

    console.log(`Uploading file ${filename} to Printful Library...`);
    const fileUploadRes = await fetch('https://api.printful.com/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${printfulApiKey}`
      },
      body: formData
    });

    const fileUploadData = await fileUploadRes.json();
    if (!fileUploadRes.ok) {
      console.error("Printful File Upload Error:", fileUploadData);
      return res.status(fileUploadRes.status).json({
        error: 'Printful File Upload Error',
        details: fileUploadData
      });
    }

    const printfulFile = fileUploadData.result;
    console.log(`Successfully uploaded file to Printful. File ID: ${printfulFile.id}`);

    // 3. Send to Printful API to Create a Sync Product using the File ID
    const printfulResponse = await fetch('https://api.printful.com/store/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${printfulApiKey}`
      },
      body: JSON.stringify({
        sync_product: {
          name: `POD Design - ${filename.replace('.png', '')}`,
          thumbnail: printfulFile.preview_url || printfulFile.thumbnail_url || printfulFile.url
        },
        sync_variants: [
          {
            variant_id: 4013, // Bella + Canvas 3001 Black Large
            retail_price: "24.99",
            files: [
              {
                id: printfulFile.id
              }
            ]
          }
        ]
      })
    });

    const printfulData = await printfulResponse.json();

    if (!printfulResponse.ok) {
      console.error("Printful Product Sync Error", printfulData);
      return res.status(printfulResponse.status).json({ 
        error: 'Printful Product Sync Error', 
        details: printfulData 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully created Draft Product in Printful',
      fileId: printfulFile.id,
      printfulProductId: printfulData.result.id
    });

  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

