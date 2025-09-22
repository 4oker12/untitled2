import { generateKeyPairSync } from 'crypto';

function gen() {
    return generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
}

const access = gen();
const refresh = gen();

console.log('ACCESS_PRIVATE:\n' + access.privateKey);
console.log('ACCESS_PUBLIC:\n' + access.publicKey);
console.log('REFRESH_PRIVATE:\n' + refresh.privateKey);
console.log('REFRESH_PUBLIC:\n' + refresh.publicKey);