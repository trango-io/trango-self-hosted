#!/bin/bash

python3 py_fail.py &

cd /home/app/
python3 api.py &
cd /home/


nginx -g 'daemon off;'