#!/bin/bash
echo -n "Enter your name and press [ENTER]: "
read username

# use rsync
scp -r packages/client/dist/* ${username}@10.16.30.211:/var/www/html/apps/inkvisitor