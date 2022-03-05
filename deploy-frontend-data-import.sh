#!/bin/bash
echo -n "Enter your name and press [ENTER]: "
read username

echo -n "Enter host [ENTER]: "
read host

# use rsync
scp -r packages/client/dist/* ${username}@${host}:/var/www/html/apps/inkvisitor-data-import