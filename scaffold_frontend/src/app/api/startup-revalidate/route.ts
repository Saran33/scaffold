import { type NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getCacheRevalidationToken } from '@/lib/utils/auth/server';

type RevalidateType = 'page' | 'layout';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-secret-token');
  const expectedToken = await getCacheRevalidationToken();

  if (!token || token !== expectedToken) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    let body: { tag?: string; path?: string; type?: RevalidateType } = {};
    try {
      body = await req.json();
    } catch {
      // If body parsing fails, defaults are used
    }

    const { tag, path, type = 'layout' } = body;

    if (tag) {
      revalidateTag(tag, 'default');
      return NextResponse.json({
        success: true,
        message: `Revalidated tag: ${tag}`,
      });
    }

    if (path) {
      revalidatePath(path, type);
      return NextResponse.json({
        success: true,
        message: `Revalidated path: ${path} (${type})`,
      });
    }

    // Default: revalidate everything
    revalidatePath('/', 'layout');
    return NextResponse.json({
      success: true,
      message: 'Revalidated entire site',
    });
  } catch (error) {
    console.error('Failed to revalidate:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
