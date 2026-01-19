import type { NextRequest } from 'next/server';
import { connection, NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import forge from 'node-forge';
import { generateKidFromPublicKey } from '@/lib/utils/crypto';

import { env } from '@/env/server.mjs';

type Jwks = {
  keys: {
    kty: string;
    use: string;
    kid: string;
    alg: string;
    e: string;
    n: string;
  }[];
};

type ErrorResponse = {
  error: string;
};

export async function GET(
  req: NextRequest
): Promise<NextResponse<Jwks | ErrorResponse>> {
  await connection();
  if (req.method === 'GET') {
    // console.log('GET /api/oauth2/well-known/jwks.json');
    const publicKeyPem = env.RSA_PUBLIC_KEY;
    if (!publicKeyPem) {
      return NextResponse.json(
        { error: 'Public key not found' },
        { status: 500 }
      );
    }
    const kid = generateKidFromPublicKey(publicKeyPem);
    const forgePublicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    // Extract modulus (n) and exponent (e) from the publicKey
    // Convert the byte array to a Buffer, then to a Base64 string
    const n = Buffer.from(forgePublicKey.n.toByteArray()).toString('base64');
    const e = Buffer.from(forgePublicKey.e.toByteArray()).toString('base64');

    const jwks = {
      keys: [
        {
          kty: 'RSA',
          use: 'sig',
          kid: kid,
          alg: 'RS256',
          // Ensure base64url encoding
          e: e.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
          n: n.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
        },
      ],
    };

    return NextResponse.json(jwks);
  } else {
    const res = NextResponse.json(
      { error: `Method ${req.method} Not Allowed` },
      { status: 405 }
    );
    res.headers.set('Allow', JSON.stringify(['GET']));
    return res;
  }
}
