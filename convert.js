import {existsSync, readFileSync, writeFileSync, readdir} from 'fs';
import {cwd} from 'process'
import colors from "colors";
import parse from "csv-parse/lib/sync.js";
import nanoid from "nanoid";
import path from "path";

export const convert = (csvPathString) => {
    const csvPath = path.join(path.resolve(), csvPathString);

    console.log(colors.green('Beginning conversion'));

    if (!existsSync(csvPath)) {
        console.log(colors.red('Unable to find CSV at given path'), csvPath);
        throw new Error(colors.red('Can not run without a CSV passed in'))
    }

    const csvFile = readFileSync(csvPath);
    const csvParsed = parse(csvFile, {
        columns: true,
        skip_empty_lines: true,
    });

    let newJson = buildJsonFromCsv(csvParsed);

    console.log(colors.green(`Writing file to ${cwd()}/accounts.json`));

    writeFileSync(`${cwd()}/accounts.json`, JSON.stringify(newJson, null, 4));
};


const buildJsonFromCsv = (csvParsed) => {
    const newFormatJson = [];
    let beginningIndex = 0;
    for (let i = 0; i < csvParsed.length; i++) {
        const obj = csvParsed[i];
        const nextObj = csvParsed[i + 1] || false;
        const thisObjNameNormalized = obj.Accounts;
        const nextObjNameNormalized = nextObj.Accounts;
        if ((obj && nextObj) && thisObjNameNormalized === nextObjNameNormalized) {
            beginningIndex = beginningIndex || i;
            continue;
        }
        const arrayChunk = i > 0 ? csvParsed.splice(beginningIndex, i) : csvParsed.splice(beginningIndex, 1);
        // Loop through array again and start moving items that aren't in the chunk into this chunk
        //  so we can process it.
        for (let j = 0; j < csvParsed.length; j++) {
            const objNameNormalized = csvParsed[j].Accounts;
            const arrayChunkNameNormalized = arrayChunk[0].Accounts;
            if (objNameNormalized === arrayChunkNameNormalized) {
                arrayChunk.push(...(csvParsed.splice(j, 1)));
                // we removed an item so let's decrement by one since the array got shorter by one
                j = j--;
            }
        }

        const builtChunk = processChunk(arrayChunk);
        newFormatJson.push(builtChunk);
        i = 0;
        beginningIndex = null;
    }

    return newFormatJson;
};

const processChunk = (arrayChunk) => {
    const oneObj = arrayChunk[0];
    const obj = {
        id: nanoid(),
        name: oneObj.Accounts,
        address: oneObj.Address,
        locations: addLocationToObj(arrayChunk[0]),
        wines: [],
    };

    addWinesToObj(arrayChunk, obj);

    return obj;
};

const addWinesToObj = (arrayChunk, obj) => {
    let wines = [];
    for (const entry of arrayChunk) {
        wines.push(entry.Wine);
    }

    obj.wines = [...new Set(wines)];
};

const addLocationToObj = (entry) => {
    if (entry['On/Off'] === 'on') {
        return 'Restaurant';
    } else if (entry['On/Off'] === 'off') {
        return 'Retail';
    } else {
        return 'Restaurant/Retail';
    }
};

readdir(path.join(path.resolve(), '/accounts'), (err, files) => {
    if (err) {
        throw new Error(err);
    }

    convert(`/accounts/${files[files.length - 1]}`);
});
