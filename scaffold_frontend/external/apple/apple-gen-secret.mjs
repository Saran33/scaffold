#!/bin/node

import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
  Creates a JWT for Apple client authentication.
  By default, the JWT has a 6 months expiry date.
  Read more: https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens#3262048
  Usage:
  node apple.js [--kid] [--iss] [--private_key] [--sub] [--expires_in] [--exp]

  Options:
    --help                 Print this help message
    --kid, --key_id        The key id of the private key
    --iss, --team_id       The Apple team ID
    --private_key          The path to the private key file to use to sign the JWT. (e.g., ./key.p8)
    --sub, --client_id     The client id to use in the JWT.
    --expires_in           Number of seconds from now when the JWT should expire. Defaults to 6 months.
    --exp                  Future date in seconds when the JWT expires
  `);
} else {
  const args = process.argv.slice(2).reduce((acc, arg, i) => {
    if (arg.match(/^--\w/)) {
      const key = arg.replace(/^--/, '').toLowerCase();
      acc[key] = process.argv[i + 3];
    }
    return acc;
  }, {});

  const {
    team_id,
    iss = team_id,

    private_key,

    client_id,
    sub = client_id,

    key_id,
    kid = key_id,

    expires_in = 86400 * 180, // Default 6 months
    exp = Math.ceil(Date.now() / 1000) + parseInt(expires_in),
  } = args;

  const privateKey = readFileSync(private_key, 'utf8');

  const jwtPayload = {
    aud: 'https://appleid.apple.com',
    iss,
    iat: Math.floor(Date.now() / 1000),
    exp,
    sub,
  };

  const jwtOptions = {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid,
    },
  };

  const token = jwt.sign(jwtPayload, privateKey, jwtOptions);

  console.log(`
Apple client secret generated. Valid until: ${new Date(exp * 1000)}
${token}`);
}
