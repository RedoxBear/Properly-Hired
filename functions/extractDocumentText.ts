import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import mammoth from 'npm:mammoth@1.6.0';
import rtfParser from 'npm:rtf-parser@1.2.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { file_url } = await req.json();

        if (!file_url) {
            return Response.json({ error: 'file_url is required' }, { status: 400 });
        }

        // Fetch the file
        const fileResponse = await fetch(file_url);
        if (!fileResponse.ok) {
            throw new Error('Failed to fetch file');
        }

        const fileExtension = file_url.split('.').pop().toLowerCase();
        let text = '';

        if (fileExtension === 'docx' || fileExtension === 'doc') {
            // Handle DOCX files with mammoth
            const arrayBuffer = await fileResponse.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
        } else if (fileExtension === 'txt' || fileExtension === 'md') {
            // Handle plain text files
            text = await fileResponse.text();
        } else if (fileExtension === 'rtf') {
            // Handle RTF files
            const arrayBuffer = await fileResponse.arrayBuffer();
            const rtfDoc = await rtfParser.parseRTF(Buffer.from(arrayBuffer));
            text = rtfDoc.text || '';
        } else {
            return Response.json({ error: 'Unsupported file type' }, { status: 400 });
        }

        return Response.json({ 
            status: 'success',
            text: text 
        });

    } catch (error) {
        console.error('Document extraction error:', error);
        return Response.json({ 
            error: error.message || 'Failed to extract document text' 
        }, { status: 500 });
    }
});