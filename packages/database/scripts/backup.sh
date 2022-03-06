#/bin/bash

# change dir to path in which this file resides
cd "$(dirname "$0")"

# delete backup* files older than 3+ days which does not include xxxx_xx_01 pattern (not the first day of month)
find . -type f -mtime +3 -name 'backup*' -not -name 'backup_[0-9][0-9][0-9][0-9]_[0-9][0-9]_01*'

dbs=( db1 db2 )

for i in "${dbs[@]}"
do
    # create backup archive
    backup_file=backup_$(date +'%Y_%m_%d')_${i}.tar.gz
    PATH=$PATH:/usr/local/bin /usr/bin/rethinkdb dump -e ${i} -c localhost:28015 -p -f ${backup_file} --password-file pw.txt
done