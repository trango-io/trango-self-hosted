FROM ubuntu:18.04

RUN apt update && apt install -y libboost-all-dev libssl-dev  g++ nginx python3.6 python3-pip curl

RUN curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh && bash nodesource_setup.sh && apt install -y nodejs

RUN pip3 install flask_restful flask_cors psutil

COPY discoveryserver/ /home/discoveryserver/

COPY app/ /home/app/

COPY nginx-selfsigned.crt /etc/ssl/certs/

COPY nginx-selfsigned.key /etc/ssl/private/

COPY dhparam.pem /etc/ssl/certs/

COPY ssl.conf /etc/nginx/conf.d/

COPY default /etc/nginx/sites-available/

RUN service nginx restart

WORKDIR /home/app/

RUN npm i && npm run build

WORKDIR /home/discoveryserver/src/

RUN g++ main.cpp WebSocketMainWS.cpp WebSocketWS.cpp -I ../lib/SimpleWebSocketServer/ -lboost_system -lssl -lcrypto -lpthread -o WebSocketWS

COPY run.sh /home/discoveryserver/src/

RUN chmod +x run.sh

RUN apt clean && rm -rf /var/lib/apt/lists/*

CMD "./run.sh"


EXPOSE 80 443
