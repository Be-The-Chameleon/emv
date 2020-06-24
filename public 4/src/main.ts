/**
 * @author sn1p3r
 */
import {existsSync, readFileSync, writeFileSync} from 'fs';
import {cwd} from 'process'
import {bgWhite, blue, green, red, yellow} from "colors";
import {parse} from "csv/lib/sync";
import nanoid = require("nanoid");

export class Main {
    private debug: boolean = false;
    constructor({debug}: {debug: boolean}) {
        this.debug = debug;
    }

    convert(csvPath: string, jsonPath: string, locationDataPath: string) {
        console.log(green('Beginning conversion'));
        let mapLatLon = true;
        if (!existsSync(csvPath)) {
            console.log(red('Unable to find CSV at given path'), csvPath);
            throw new Error(red('Can not run without a CSV passed in'))
        }
        if (!existsSync(jsonPath)) {
            console.log(red('Unable to find JSON at given path'), jsonPath);
            console.log(yellow('Continuing with converting CSV to new structure'));
        }
        if (!locationDataPath || !existsSync(locationDataPath)) {
            console.log(yellow('No location data found or provided, skipping lat lon mapping'));
            mapLatLon = false;
        }

        const csvFile = readFileSync(csvPath);
        const csvParsed = parse(csvFile, {
            columns: true,
            skip_empty_lines: true,
        });

        let newJson = this.buildJsonFromCsv(csvParsed);

        if (mapLatLon) {
            const locationData = require(locationDataPath);
            newJson = this.mapLatLonData(newJson, locationData);
        }

        console.log(green(`Writing file to ${cwd()}/converted.json`));
        writeFileSync(`${cwd()}/converted.json`, JSON.stringify(newJson, null, 4));
    };


    private buildJsonFromCsv(csvParsed) {
        const newFormatJson = [];
        let beginningIndex = 0;
        for (let i = 0; i < csvParsed.length; i++) {
            const obj = csvParsed[i];
            const nextObj = csvParsed[i + 1] ?? false;
            const thisObjNameNormalized = this.normalizeString(obj.Account);
            const nextObjNameNormalized = this.normalizeString(nextObj.Account);
            console.log('Name:', bgWhite(blue(thisObjNameNormalized)), nextObjNameNormalized, `Matches? ${thisObjNameNormalized === nextObjNameNormalized}`);
            if ((obj && nextObj) && thisObjNameNormalized === nextObjNameNormalized) {
                beginningIndex = beginningIndex ?? i;
                continue;
            }
            if (this.debug) {
                console.log(yellow('this index'), i);
                console.log(yellow('beginning index value'), beginningIndex);
            }
            const arrayChunk = i > 0 ? csvParsed.splice(beginningIndex, i) : csvParsed.splice(beginningIndex, 1);
            // Loop through array again and start moving items that aren't in the chunk into this chunk
            //  so we can process it.
            for (let j = 0; j < csvParsed.length; j++) {
                if (this.debug) {
                    console.log(yellow(`arrayChunk value:`), arrayChunk);
                }
                const objNameNormalized = this.normalizeString(csvParsed[j].Account);
                const arrayChunkNameNormalized = this.normalizeString(arrayChunk[0].Account);
                if (objNameNormalized === arrayChunkNameNormalized) {
                    arrayChunk.push(...(csvParsed.splice(j, 1)));
                    // we removed an item so let's decrement by one since the array got shorter by one
                    j = j--;
                }
            }

            const builtChunk = this.processChunk(arrayChunk);
            newFormatJson.push(builtChunk);
            i = 0;
            beginningIndex = null;
        }
        return newFormatJson;
    }

    private processChunk(arrayChunk: any[]) {
        const oneObj = arrayChunk[0];
        const obj = {
            id: nanoid(),
            name: this.normalizeString(oneObj.Account),
            address: {
                street: oneObj.Address,
                city: oneObj.City,
                zip: oneObj['Name Zip'],
                state: oneObj.State,
                region: oneObj.Region,
            },
            wines: [],
            locations: this.addLocationToObj(arrayChunk[0]),
        };

        this.addWinesToObj(arrayChunk, obj);

        return obj;
    }

    private addWinesToObj(arrayChunk: any[], obj: { address: { zip: any; city: any | string; street: any; state: any; region: any | string }; wines: any[]; locations: string; name: string; id: string }) {
        for (const entry of arrayChunk) {
            if (this.debug) {
                console.log(yellow('Pushing wine for chunk'), entry);
            }
            obj.wines.push({
                name: entry.Memo,
                last_update: entry.Month,
                units: entry['Btl / Keg Qty'],
            });
        }
    }

    private addLocationToObj(entry: any) {
        if (this.debug) {
            console.log(yellow('Pushing location of: '), entry);
        }

        if(entry['On/Off'] == 'on') {
          return 'Resturant';
        } else if(entry['On/Off'] == 'off') {
          return 'Retail';
        } else {
          return 'Resturant/Retail';
        }
    }

    private mapLatLonData(newJson: any[], locationData: any[]): any[] {
        for (const row of newJson) {
            if (this.debug){
                console.log(yellow('Row:'), row);
            }
            const location = locationData.find(value => value.name.toLowerCase() === row.name.toLowerCase());
            if (location) {
                row.address.lat = location.lat;
                row.address.lon = location.lon;
            }
        }
        return newJson;
    }

    private normalizeString(name: string) {
        return name?.replace(/(?:'|-\s)+/g, '').trim().toLowerCase();
    }

    private removeOldWineData(arrayChunk: any[]) {
        for (let i = 0; i < arrayChunk.length; i++) {
            // somehow i need to filter based by the last_update date
        }
    }
}
