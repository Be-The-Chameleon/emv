import fetch from 'node-fetch';
import {writeFileSync} from 'fs';
import {cwd} from 'process';

const apiUrl = 'https://graph.instagram.com';

const setData = async (accessToken, fileName) => {
    const response = await fetch(`${apiUrl}/me?access_token=${accessToken}&fields=media`);
    const user = await response.json();
    const mediaIds = user.media.data.map((m) => m.id);

    const mediaPromises = mediaIds.map(async (id) => {
        const mediaItem = await fetch(`${apiUrl}/${id}?access_token=${accessToken}&fields=caption,media_url`);

        return mediaItem.json();
    });
    const media = await Promise.all(mediaPromises);

    writeFileSync(`${cwd()}/${fileName}`, JSON.stringify(media, null, 4));
};

setData(process.env.MAIN_ACCESS_TOKEN, 'main-media.json');
setData(process.env.WEDDING_ACCESS_TOKEN, 'wedding-media.json');
