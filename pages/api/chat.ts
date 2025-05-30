export default async function handler(req, res) {
  const { message, personality } = req.body;

  // 仮の返答（後でAPIに差し替え可能）
  const mockReply = `(${personality}) にゃんぷっぷー: 「${message}」にゃ♪`;

  res.status(200).json({ response: mockReply });
}
