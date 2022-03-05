#!/bin/bash

echo -n "Enter your name and press [ENTER]: "
read username

echo -n "Enter host [ENTER]: "
read host

rsync -a ./packages/server/package* ./packages/server/env ./packages/server/secret ./packages/server/dist ${username}@${host}:/var/www/html/apps/inkvisitor-data-import/server 
rsync -a ./packages/server/src/service/emails ${username}@${host}:/var/www/html/apps/inkvisitor-data-import/server/dist/server/src/service

ssh ${username}@${host} 'cd /var/www/html/apps/inkvisitor-data-import/server && npm install && npm run restart:data-import'
