FROM ubuntu:18.04

RUN apt update && apt install -y libboost-all-dev && apt -y install libssl-dev && apt -y install g++ && apt -y install nginx && apt clean && rm -rf /var/lib/apt/lists/*

COPY discoveryserver/ /home/discoveryserver/

COPY app/ /home/app/

COPY nginx-selfsigned.crt /etc/ssl/certs/

COPY nginx-selfsigned.key /etc/ssl/private/

COPY dhparam.pem /etc/ssl/certs/

COPY ssl.conf /etc/nginx/conf.d/

COPY default /etc/nginx/sites-available/

RUN service nginx restart

WORKDIR /home/discoveryserver/src/

RUN g++ main.cpp WebSocketMainWS.cpp WebSocketWS.cpp -I ../lib/SimpleWebSocketServer/ -lboost_system -lssl -lcrypto -lpthread -o WebSocketWS

COPY run.sh /home/discoveryserver/src/

RUN chmod +x run.sh

CMD "./run.sh"


EXPOSE 80 443
