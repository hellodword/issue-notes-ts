import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { archiveEntry, convertEntry } from './entry';

yargs(hideBin(process.argv))
  .command({
    command: 'convert',
    handler: () => {
      console.log('convert!');
      convertEntry({});
    },
  })
  .command({
    command: 'archive [link]',
    builder: (_yargs: yargs.Argv) => {
      return _yargs.option('engine', {
        type: 'string',
      });
    },
    handler: (argv: yargs.Arguments<{ engine: string } & { link: string }>) => {
      console.log('archive!', argv.engine, argv.link);
      archiveEntry({ engine: argv.engine, link: argv.link });
    },
  })
  .parse();
