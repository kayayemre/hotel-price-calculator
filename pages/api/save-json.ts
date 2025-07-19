// pages/api/save-json.ts
import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST destekleniyor.' });
  }

  const { filename, content } = req.body;

  if (!filename || !content) {
    return res.status(400).json({ error: 'Eksik veri.' });
  }

  try {
    const filePath = path.join(process.cwd(), 'public', filename);
    fs.writeFileSync(filePath, content);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Dosya yazma hatası:', error);
    return res.status(500).json({ error: 'Dosya yazılamadı.' });
  }
}
