#!/bin/bash
if [ -e "$HOME/.bashrc" ]; then source $HOME/.bashrc; fi;
if [ -e "$HOME/.nvm/nvm.sh" ]; then source $HOME/.nvm/nvm.sh; fi;
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd $DIR;
/usr/bin/env node $DIR/1_get_data.js;
/usr/bin/env node $DIR/2_update_layout.js;
/usr/bin/env node $DIR/3_export_positions.js;
/usr/bin/env node $DIR/4_generate_tiles.js;