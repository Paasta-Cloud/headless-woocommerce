import {cpSync,mkdirSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
// Package source modules, not the site's credentials or deployment scripts.
const temporary=mkdtempSync(join(tmpdir(),'paasta-connector-'));
const plugin=join(temporary,'paasta-headless-connector');
cpSync('wordpress/plugins/paasta-headless-connector',plugin,{recursive:true});
cpSync('wordpress/plugins/paasta-headless-builder',join(plugin,'builder'),{recursive:true});
mkdirSync(join(plugin,'modules'));
for(const file of ['khanechin-account.php','khanechin-return.php'])cpSync(`wordpress/mu-plugins/${file}`,join(plugin,'modules',file));
mkdirSync('public/downloads',{recursive:true});
const output=resolve('public/downloads/paasta-headless-connector.zip');
if(process.platform==='win32')execFileSync('powershell.exe',['-NoProfile','-Command',`Compress-Archive -LiteralPath '${plugin.replaceAll("'","''")}' -DestinationPath '${output.replaceAll("'","''")}' -Force`]);
else execFileSync('zip',['-qr',output,'paasta-headless-connector'],{cwd:temporary});
console.log('Built public/downloads/paasta-headless-connector.zip');
