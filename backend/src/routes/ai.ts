import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const aiRouter = new Hono();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Você é um assistente inteligente para gestão de salão de beleza, barbearia ou clínica estética.
Você ajuda proprietários e funcionários com:
- Gestão de agendamentos e clientes
- Estratégias de precificação e promoções
- Dicas de atendimento ao cliente
- Controle de estoque de produtos
- Análise financeira e relatórios
- Marketing e fidelização de clientes
- Treinamento de equipe
- Tendências do setor de beleza

Responda sempre em português brasileiro, de forma clara, prática e profissional.
Quando der conselhos, seja específico e forneça exemplos concretos que podem ser aplicados imediatamente.`;

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ).min(1),
});

aiRouter.post("/chat", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid request", details: parsed.error.issues }, 400);
  }

  const { messages } = parsed.data;

  return streamSSE(c, async (stream) => {
    try {
      const claudeStream = client.messages.stream({
        model: "claude-opus-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      for await (const event of claudeStream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          await stream.writeSSE({
            data: JSON.stringify({ text: event.delta.text }),
            event: "delta",
          });
        }
      }

      await stream.writeSSE({ data: "", event: "done" });
    } catch (err) {
      console.error("Claude streaming error:", err);
      await stream.writeSSE({
        data: JSON.stringify({ error: "Failed to generate response" }),
        event: "error",
      });
    }
  });
});

export { aiRouter };
