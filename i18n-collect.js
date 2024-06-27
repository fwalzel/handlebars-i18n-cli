#!/usr/bin/env node

const { Command } = require('commander');
const program = new Command();

program
  .name('i18n-collect')
  .description('CLI to collect internationalization keys')
  .arguments('<source> <target>')
  .option('-a, --alphabetical', 'sort keys alphabetically')
  .option('-dr, --dryRun', 'perform a dry run without making any changes')
  .option('-e, --empty', 'include empty keys')
  .option('--lng <languages>', 'specify languages, e.g., de,fr,es', (value) => value.split(','))
  .option('-l, --log', 'enable logging')
  .option('-sf, --separateLngFiles', 'create separate files for each language')
  .option('--translFunc <function>', 'specify your custom translation function name')
  .option('-u, --update', 'update existing keys')
  .action((source, target, options) => {
    // Placeholder function to handle CLI logic
    console.log('Source:', source);
    console.log('Target:', target);
    console.log('Options:', options);
  });

program.parse(process.argv);

// If no arguments are provided, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}