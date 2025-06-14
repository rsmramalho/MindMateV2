// Arquivo: api/mindmate.js

// Importa o Google Generative AI SDK
import { GoogleGenerativeAI } from "@google/generative-ai";

// Pega a chave da API das "Environment Variables" do Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define o handler da função serverless
export default async function handler(request, response) {
  // Permite que o Vercel lide com CORS automaticamente
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responde às solicitações de preflight OPTIONS
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  try {
    const { text } = request.body;
    if (!text) {
      return response.status(400).json({ success: false, error: "Texto inválido na requisição." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const today = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const prompt = `
      Sua única função é analisar o texto e traduzi-lo para um objeto JSON estruturado. Retorne apenas o JSON.
      Formato: { "classificacao": { "nome_atividade": "string", "tipo": "string", "tags": "string", "data_agendada": "string (YYYY-MM-DD) | null", "hora_agendada": "string (HH:mm) | null", "subtarefas": [] }, "google_action": { "service": "string", "payload": {} } }
      ---
      Regras: Para 'planner', use service:"GoogleCalendar". Para 'tarefa', service:"GoogleTasks". Para 'projeto', service:"GoogleDocs". Para 'diario', service:"GoogleKeep". Hoje é ${today}. Converta datas relativas como "amanhã".
      ---
      Texto do Usuário: ${text}
    `;

    const result = await model.generateContent(prompt);
    const geminiResponseText = await result.response.text();
    const geminiJsonResponse = JSON.parse(geminiResponseText.replace(/```json\n?|\n```/g, ''));

    // NOTA: A execução da ação (Google Calendar, etc.) foi removida
    // por enquanto para garantir que a comunicação com a IA funcione primeiro.
    
    return response.status(200).json({ success: true, gemResponse: geminiJsonResponse });

  } catch (error) {
    console.error("Erro na função da API:", error);
    return response.status(500).json({ success: false, error: error.toString() });
  }
}
