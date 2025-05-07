import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // JSONファイルのパスを取得
    const filePath = path.join(process.cwd(), 'src', 'data', 'fetch_data.json')
    
    // ファイルを読み込む
    const fileData = fs.readFileSync(filePath, 'utf8')
    
    // JSONとしてパース
    const jsonData = JSON.parse(fileData)
    
    // レスポンスを返す
    return NextResponse.json(jsonData)
  } catch (error) {
    console.error('Error reading swing data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch swing data' },
      { status: 500 }
    )
  }
}