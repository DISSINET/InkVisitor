#/bin/bash

# change dir to path in which this file resides
cd "$(dirname "$0")/archives"

dbs=( inkvisitor inkvisitor_sandbox inkvisitor_staging )

for i in "${dbs[@]}"
do
    # delete backup* files older than 3+ days which does not include xxxx_xx_01 pattern (not the first day of month)
    find . -type f -mtime +3 -name 'backup*' -not -name 'backup_[0-9][0-9][0-9][0-9]_[0-9][0-9]_01*' -delete

    # create backup archive
    backup_file=backup_$(date +'%Y_%m_%d')_${i}.tar.gz
    PATH=$PATH:/usr/local/bin /usr/bin/rethinkdb dump -e ${i} -c localhost:28015 -p -f ${backup_file} --password-file ../pw.txt
done
