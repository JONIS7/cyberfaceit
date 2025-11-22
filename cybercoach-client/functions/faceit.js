const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Configuração de CORS para permitir que seu site acesse a função
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Responde a requisições OPTIONS (pre-flight do navegador)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Pega o caminho da URL (ex: /players?nickname=dxtzin)
  // O Netlify envia o caminho relativo em event.path, precisamos extrair a parte útil
  const path = event.path.replace(/\/\.netlify\/functions\/faceit\/?/, ''); 
  const queryString = Object.keys(event.queryStringParameters).map(key => key + '=' + event.queryStringParameters[key]).join('&');
  
  const faceitEndpoint = path ? path : '';
  const finalUrl = `https://open.faceit.com/data/v4/${faceitEndpoint}${queryString ? '?' + queryString : ''}`;

  console.log(`Proxying to: ${finalUrl}`);

  try {
    const response = await fetch(finalUrl, {
      headers: {
        'Authorization': `Bearer 7c72e289-6cc6-4b5b-899e-d06a4f2a293a`, // Sua chave aqui
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Faceit API Error: ${response.statusText}` })
      };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};