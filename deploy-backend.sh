#!/bin/bash
echo -n "Enter your name and press [ENTER]: "
read username

rsync -a ./packages/server/package* ./packages/server/env ./packages/server/secret ./packages/server/dist  ${username}@10.16.30.211:/var/www/html/apps/inkvisitor/server 
ssh ${username}@10.16.30.211 'cd /var/www/html/apps/inkvisitor/server && npm install && npm run restart:prod'
