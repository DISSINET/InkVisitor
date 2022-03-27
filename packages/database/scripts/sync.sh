#/bin/bash

# change dir to path in which this file resides
cd "$(dirname "$0")"

echo 'Start: '; date 

rclone sync archives remote:inkvisitor-backup
