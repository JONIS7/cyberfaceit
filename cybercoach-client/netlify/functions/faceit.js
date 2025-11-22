import fetch from 'node-fetch';

const FACEIT_API_KEY = "7c72e289-6cc6-4b5b-899e-d06a4f2a293a";

export const handler = async (event, context) => {
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: ''
        };
    }

    try {
        // Extract the path after /.netlify/functions/faceit/
        // Example: /.netlify/functions/faceit/players?nickname=dxtzin -> players?nickname=dxtzin
        const path = event.path.replace(/^\/\.netlify\/functions\/faceit\/?/, '');

        // Reconstruct query parameters
        const queryString = event.rawQuery;
        const faceitUrl = `https://open.faceit.com/data/v4/${path}${queryString ? '?' + queryString : ''}`;

        console.log(`[Proxy] Forwarding to: ${faceitUrl}`);

        const response = await fetch(faceitUrl, {
            headers: {
                'Authorization': `Bearer ${FACEIT_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `Faceit API Error: ${response.statusText}` })
            };
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // Allow all origins
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" })
        };
    }
};
