import type { NextApiRequest, NextApiResponse } from 'next';
import { getAiResponse } from '../../lib/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const reply = await getAiResponse(req.body);
    res.status(200).json({ reply: reply });
  } catch (error: any) {
    // The error is already logged in the shared function, but we can log it here too if needed.
    res.status(500).json({ error: error.message || "内部サーバーエラーが発生しました。" });
  }
}
