/**
 * @author sn1p3r
 */

import {Main} from "./main";
import * as yargs from "yargs";

yargs
    .command('convert [options]',
        'convert a CSV file and concat it to an existing json file',
        (yargs) => {
            yargs.options({
                'csv': {
                    type: 'string',
                    describe: 'The CSV file you need to convert'
                },
                'json': {
                    type: 'string',
                    describe: 'The JSON you want to concatenate to',
                },
                'location-data': {
                    type: 'string',
                    describe: 'The json file containing location data'
                },
                'debug': {
                    type: 'boolean',
                    describe: 'Log debug level',
                    default: false
                }
            })
        },
        function (argv: { csv: string, json?: string, 'location-data'?: string, debug: boolean }) {
            console.log("Starting: =================>");
            const main = new Main({debug: argv.debug});
            main.convert(argv.csv, argv.json, argv['location-data']);
        })
    .help()
    .argv;
