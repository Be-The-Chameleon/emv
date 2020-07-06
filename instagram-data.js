import fetch from 'node-fetch';
import {writeFileSync} from 'fs';
import {cwd} from 'process';

const apiUrl = 'https://graph.instagram.com';

const getInstagramData = async () => {
    const accessToken = process.env.ACCESS_TOKEN;
    const response = await fetch(`${apiUrl}/me?access_token=${accessToken}&fields=media`);
    const user = await response.json();
    const mediaIds = user.media.data.map((m) => m.id);

    const mediaPromises = mediaIds.map(async (id) => {
        const mediaItem = await fetch(`${apiUrl}/${id}?access_token=${accessToken}&fields=caption,media_url`);

        return mediaItem.json();
    });
    const media = await Promise.all(mediaPromises);

    writeFileSync(`${cwd()}/media.json`, JSON.stringify(media, null, 4));
};

getInstagramData();
