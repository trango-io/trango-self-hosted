#!/bin/bash

cd /home/discoveryserver/src
pkill -9 WebSocketWS
sleep 10
./WebSocketWS &
