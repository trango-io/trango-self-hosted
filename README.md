## Description
Trango Self-hosted is a calling and file-sharing solution that works over LAN (local area networks). It does not need to involve the internet for calling or file sharing, so it's ideal for offices, hotels, houses, restaurants, and any space where people use the same Public IP address or the same WiFi network. The package includes a discovery server and a web app which can be deployed on the local machine and can be accessed from anywhere in the network.<br />
Trango Web can be visited at https://web.trango.io . Please note that Trango is in beta. <br />
**Note** The open-source self-hosted version is now compatible with Mobile and Desktop Apps.

The main features are:
- One-to-One and Group Audio/Video Calling.
- File Transferring.
- Ability to change auto-generated IDs.
- No Internet Involved.
- Encrypted and Secure.
- HD quality for calling.

## Deployment
The package can be deployed on a Linux machine, also. To provide more robust support a docker image is available on Docker Hub.
### Linux Deployment
#### Debian Prerequisites
- ``` sudo apt update && sudo apt install -y libboost-all-dev libssl-dev g++ nginx python3.6 python3-pip curl``` <br />
- ``` curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh && bash nodesource_setup.sh && apt install -y nodejs``` <br />
- ``` pip3 install flask_restful flask_cors psutil```
#### RHEL Prerequisites
- ``` sudo yum -y update && sudo yum install -y boost boost-devel boost-system boost-filesystem boost-thread openssl-devel gcc-c++ nginx python3.6 python3-pip curl``` <br />
- ``` curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh && bash nodesource_setup.sh && yum install -y nodejs``` <br />
- ``` pip3 install flask_restful flask_cors psutil```
#### Deployment
Follow these for deployment:
- Clone or download this repo into your system.
- On Terminal run these commands:
  - ``` cd /path/to/this/repo/folder/ ```
  - ``` cd app/```
  - ``` npm i && npm run build```
  - ``` cd ..```
  - ``` sudo cp nginx-selfsigned.crt /etc/ssl/certs/ ```
  - ``` sudo cp nginx-selfsigned.key /etc/ssl/private/ ```
  - ``` sudo cp dhparam.pem /etc/ssl/certs/ ```
  - ``` sudo cp ssl.conf /etc/nginx/conf.d/ ```
  - Edit ssl.conf file and change **root /home/app/** to **root /path/to/build/folder/in/app/folder**.
  - ``` sudo cp default /etc/nginx/sites-available/ ```
  - ``` sudo service nginx restart ```
  - ``` sudo cd discoveryserver/src/ ```
  - ``` g++ main.cpp WebSocketMainWS.cpp WebSocketWS.cpp -I ../lib/SimpleWebSocketServer/ -lboost_system -lssl -lcrypto -lpthread -o WebSocketWS ```
  - ``` ./WebSocketWS &```
  
#### Docker Deployment (Windows/Linux).
Install docker on your machine and follow these steps:
- Download the Trango Self-Hosted version docker image by this command:
  - ```sudo docker pull tak786/trango-self-hosted```
- Run the Self-Hosted version:
  - ```sudo docker container run -d -p 80:80 -p 443:443 --name trango tak786/trango-self-hosted```
- Test it by accessing the IP address of the machine running the Self-Hosted version on your browser.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push the Branch upstream (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the GPL-2.0 License. See `LICENSE` for more information.

## Acknowledgements
* [WebRTC](https://webrtc.org/)
* [Simple-Peer](https://github.com/feross/simple-peer)
