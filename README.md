## Description
Trango self-hosted is a calling and file sharing solution which works over LAN (local area networks). It does not need to involve the internet for calling or file sharing. Ideal for offices, hotels, houses, restaraunts and literally any space where people use the same Public IP address or the same WiFi network. The pacakage comes with a discovery server and a web app which can be deployed on local machine and can be accessed from anywhere in the network.<br />
Trango Web can be visited at https://web.trango.io . Please note that trango is in beta.

The Following are the main features.
- One to One Audio/Video Calling.
- File Transffering.
- Ability to change auto genertated ID's.
- No Internet Involved.
- Encrypted and Secure.
- HD Calling quality.

## Deployment
The package can be deployed on a linux machine also to provide more rubust support a docker image is availabe on docker hub.
### Linux Deployment
#### Debian Prerequisites
``` sudo apt update && sudo apt install -y libboost-all-dev libssl-dev g++ ```
#### RHEL Prerequisites
``` sudo yum -y update && sudo yum install -y boost boost-devel boost-system boost-filesystem boost-thread openssl-devel gcc-c++ ```
#### Deployment
The Following are the steps for deployment.
- Clone or download this repo into your system.
- On Terminal run the following commands.
  - ``` cd /path/to/this/repo/folder/ ```
  - ``` sudo cp nginx-selfsigned.crt /etc/ssl/certs/ ```
  - ``` sudo cp nginx-selfsigned.key /etc/ssl/private/ ```
  - ``` sudo cp dhparam.pem /etc/ssl/certs/ ```
  - ``` sudo cp ssl.conf /etc/nginx/conf.d/ ```
  - Edit ssl.conf file and change **root /home/app/** to **root /path/to/app/folder**.
  - ``` sudo cp default /etc/nginx/sites-available/ ```
  - ``` sudo service nginx restart ```
  - ``` sudo cd discoveryserver/src/ ```
  - ``` g++ main.cpp WebSocketMainWS.cpp WebSocketWS.cpp -I ../lib/SimpleWebSocketServer/ -lboost_system -lssl -lcrypto -lpthread -o WebSocketWS ```
  - ``` ./WebSocketWS &```
  
#### Docker Deployment (Windows/Linux).
Install docker on your machine and follow the following steps.
- Download Trango Self-Hosted version docker image by executing below command.
  - ```sudo docker pull tak786/trango-self-hosted```
- Run the Self-Hosted version by executing following command.
  - ```sudo docker container run -d -p 80:80 -p 443:443 --name trango tak786/trango-self-hosted```
- Test it by accessing IP address of the machine running Self-Hosted version on your browser.

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgements
* [WebRTC](https://webrtc.org/)
* [Simple-Peer](https://github.com/feross/simple-peer)
