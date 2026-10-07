import type { NextApiRequest, NextApiResponse } from 'next';
import { getAiResponse, getAiResponseRaw } from '../../lib/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const isStream = req.body.stream === true;

  if (isStream) {
    try {
      const upstreamResponse = await getAiResponseRaw(req.body, true);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');

      if (!upstreamResponse.body) {
        res.status(500).end('No upstream body');
        return;
      }

      const reader = upstreamResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (error: any) {
      console.error("Streaming error in /api/chutes:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "内部サーバーエラーが発生しました。" });
      } else {
        res.end();
      }
    }
  } else {
    try {
      const reply = await getAiResponse(req.body);
      res.status(200).json({ reply: reply });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "内部サーバーエラーが発生しました。" });
    }
  }
}
