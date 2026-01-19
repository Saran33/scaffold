import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';

const validTags = [''];

export async function POST(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get('tag');

  if (!tag) {
    return Response.json(
      {
        error:
          `Missing tag parameter. Use one of: ${validTags.join(', ')}, all`,
      },
      { status: 400 }
    );
  }

  if (tag === 'all') {
    try {
      // Revalidate all tags
      validTags.forEach(tagName => revalidateTag(tagName, 'default'));
      return Response.json({
        success: true,
        revalidated: validTags,
        timestamp: Date.now(),
      });
    } catch (error) {
      return Response.json(
        { error: 'Failed to revalidate all caches' },
        { status: 500 }
      );
    }
  }

  if (!validTags.includes(tag)) {
    return Response.json(
      { error: `Invalid tag. Must be one of: ${validTags.join(', ')}, all` },
      { status: 400 }
    );
  }

  try {
    revalidateTag(tag, 'default');
    return Response.json({
      success: true,
      revalidated: tag,
      timestamp: Date.now(),
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to revalidate cache' },
      { status: 500 }
    );
  }
}
