import { NextResponse } from "next/server";
import { signAnswer } from "@/lib/captcha";

export async function GET() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const answer = a + b;
  const question = `${a} + ${b} = ?`;
  const token = signAnswer(answer);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="50" viewBox="0 0 180 50">
    <rect width="180" height="50" fill="#f0f0f0" rx="5"/>
    <text x="90" y="32" font-family="Arial, sans-serif" font-size="20" fill="#333" text-anchor="middle" font-weight="bold">${question}</text>
    <line x1="10" y1="${10 + Math.random() * 30}" x2="170" y2="${10 + Math.random() * 30}" stroke="#ccc" stroke-width="1"/>
    <line x1="10" y1="${10 + Math.random() * 30}" x2="170" y2="${10 + Math.random() * 30}" stroke="#ddd" stroke-width="1"/>
  </svg>`;

  return NextResponse.json(
    {
      svg: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
      token,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
