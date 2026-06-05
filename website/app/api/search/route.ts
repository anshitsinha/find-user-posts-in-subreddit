import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const subreddit = searchParams.get('subreddit')
  const username = searchParams.get('username')

  if (!subreddit || !username) {
    return NextResponse.json(
      { error: 'Missing subreddit or username parameter.' },
      { status: 400 }
    )
  }

  const redditUrl = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/search.json?q=author:${encodeURIComponent(username)}&restrict_sr=1&sort=new&limit=100&raw_json=1&include_over_18=on`

  try {
    const response = await fetch(redditUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    })

    const contentType = response.headers.get('content-type') || ''

    if (!response.ok || contentType.includes('text/html')) {
      return NextResponse.json(
        { blocked: true, subreddit, username },
        { status: 403 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
