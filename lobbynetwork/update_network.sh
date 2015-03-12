#!/bin/bash
NODE=`which node`
DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd $DIR;
$NODE $DIR/1_get_data.js;
$NODE $DIR/2_update_layout.js;
$NODE $DIR/3_export_positions.js;
$NODE $DIR/4_generate_tiles.js;