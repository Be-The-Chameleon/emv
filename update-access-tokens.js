import fetch from 'node-fetch';
import sodium from 'tweetsodium';

const instagramApiUrl = 'https://graph.instagram.com';
const githubApiUrl = 'https://api.github.com';

const encryptSecret = (value, key) => {
    const messageBytes = Buffer.from(value);
    const keyBytes = Buffer.from(key, 'base64');

    const encryptedBytes = sodium.seal(messageBytes, keyBytes);

    return Buffer.from(encryptedBytes).toString('base64');
};

const updateToken = async (secretName) => {
    const updatedAccessTokenResponse = await fetch(`${instagramApiUrl}/refresh_access_token?grant_type=ig_refresh_token&access_token=${process.env[secretName]}`);
    const {access_token} = await updatedAccessTokenResponse.json();

    const publicKeyResponse = await fetch(`${githubApiUrl}/repos/Be-The-Chameleon/emv/actions/secrets/public-key`, {
        headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `token ${process.env.GITHUB_TOKEN_PERSONAL}`
        }
    });
    const {key, key_id} = await publicKeyResponse.json();

    const encryptedSecret = encryptSecret(access_token, key.toString('base64'));

    await fetch(`${githubApiUrl}/repos/Be-The-Chameleon/emv/actions/secrets/${secretName}`, {
        body: JSON.stringify({
            encrypted_value: encryptedSecret,
            key_id
        }),
        method: 'PUT',
        headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `token ${process.env.GITHUB_TOKEN_PERSONAL}`
        }
    });
};

updateToken('MAIN_ACCESS_TOKEN');
updateToken('WEDDING_ACCESS_TOKEN');
