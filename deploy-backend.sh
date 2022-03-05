#!/bin/bash
echo -n "Enter your name and press [ENTER]: "
read username

echo -n "Enter host [ENTER]: "
read host

rsync -a ./packages/server/package* ./packages/server/env ./packages/server/secret ./packages/server/dist ${username}@${host}:/var/www/html/apps/inkvisitor/server 
rsync -a ./packages/server/src/service/emails ${username}@${host}:/var/www/html/apps/inkvisitor/server/dist/server/src/service

ssh ${username}@${host} 'cd /var/www/html/apps/inkvisitor/server && npm install && npm run restart:production'
