#include "WebSocketMainWS.h"

unordered_map<string, PeerData*> WebSocketMainWS::peerMap;
pthread_mutex_t WebSocketMainWS::peerMapLock = PTHREAD_MUTEX_INITIALIZER;

void WebSocketMainWS::OnConnected(shared_ptr<WsServer::Connection> hConnection) {
    string email = hConnection->query_string;
    json mError = {
        {"type", "error"},
        {"module", "connection"}
    };
    if (email.empty()) {
        mError["message"] = "Empty User ID parameter";
        hConnection->send_close(4000, mError.dump());
        return;
    }
}

void WebSocketMainWS::OnMessage(shared_ptr<WsServer::Connection> hConnection, string sMessage) {
    if (!sMessage.empty() && hConnection.get() != NULL) {
        try {
            json parsedMessage = json::parse(sMessage);
            if (parsedMessage.contains("type")) {
                if (parsedMessage["type"] == "register") {
                    if (parsedMessage.contains("data")) {
                        if (RegisterPeer(hConnection, parsedMessage["data"])) {
                            json rRegister = {
                                {"type", "responce"},
                                {"module", "register"}
                            };
                            rRegister["message"] = "Successfully Registered";
                            rRegister["pubip"] = hConnection->remote_endpoint().address().to_string();
                            WebSocketWS::SendMessage(hConnection, rRegister.dump());
                        }
                    }  
                } else if (parsedMessage["type"] == "samenetwork") {
                    string rDevices = FindPeerSameNetwork(hConnection);
                    WebSocketWS::SendMessage(hConnection, rDevices);
                } else if (parsedMessage.contains("to") && parsedMessage.contains("from")){
                    if (!parsedMessage["to"].empty() && !parsedMessage["from"].empty()) {
                        RelayMessages(hConnection, parsedMessage);
                    }
                } else if (parsedMessage["type"] == "disconnect") {
                    if (!parsedMessage["email"].empty()) {
                        if (peerMap.find(parsedMessage["email"]) != peerMap.end()) {
                            PeerData* pData = peerMap[parsedMessage["email"]];
                            OnDisconnected(pData->m_hConnection); 
                        }
                    }
                }
            }

        } catch (json::exception& e) {
            cout << "message: " << e.what() << '\n' 
                << "exception id: " << e.id << std::endl;
        }
    }
}

void WebSocketMainWS::OnDisconnected(shared_ptr<WsServer::Connection> hConnection) {
    string email = hConnection->query_string;
    DeletePeer(hConnection, email);
}
void WebSocketMainWS::OnError(shared_ptr<WsServer::Connection> hConnection, string sError) {
    string email = hConnection->query_string;
    DeletePeer(hConnection, email);
    cout << sError << endl;
}

bool WebSocketMainWS::RegisterPeer(shared_ptr<WsServer::Connection> hConnection, json data) {
    json mError = { {"type", "error"}, {"module", "register"} };
    if (data.contains("name") && data.contains("email") && data.contains("privip")
         && data.contains("devtype") && data.contains("devname") && data.contains("registered")) {
            if (!data["privip"].empty() && !data["devtype"].empty() && !data["email"].empty() 
                    && !data["name"].empty() && !data["devname"].empty() && !data["registered"].empty()) {
                string email = data["email"].get<string>();
                if (email == hConnection->query_string) {
                    if (peerMap.find(email) == peerMap.end()) {
                        PeerData* pData = new PeerData;
                        if (pthread_mutex_lock(&peerMapLock) != 0) {
                            mError["message"] = "Unable to Enqire Lock";
                            return false;
                        }
                        pData->m_hConnection = hConnection;
                        pData->m_name = data["name"].get<string>();
                        pData->m_email = email;
                        pData->m_privIP = data["privip"].get<string>();
                        pData->m_devType = data["devtype"].get<string>();
                        pData->m_devName = data["devname"].get<string>();
                        pData->m_registered = data["registered"].get<bool>();
                        pData->m_roomID = "";
                        string pubIP = hConnection->remote_endpoint().address().to_string();
                        pData->m_pubIP = pubIP;
                        peerMap[email] = pData;
                        if (pthread_mutex_unlock(&peerMapLock) != 0) {
                            mError["message"] = "Unable to Release Lock";
                            return false; 
                        }
                        SendPeersInfo(pData, "addpeer");
                        return true;
                    } else {
                        mError["message"] = "User already connected";
                        hConnection->send_close(4000, mError.dump());
                        return false;
                    }
            } else {
                mError["message"] = "Invalid registration format";
                hConnection->send_close(4000, mError.dump());
                DeletePeer(hConnection, hConnection->query_string);
                return false;
            }
        } else {
            mError["message"] = "Invalid registration format";
            hConnection->send_close(4000, mError.dump());
            DeletePeer(hConnection, hConnection->query_string);
            return false;
        }
    } else {
        mError["message"] = "Invalid registration format";
        hConnection->send_close(4000, mError.dump());
        DeletePeer(hConnection, hConnection->query_string);
        return false;
    }
}


void WebSocketMainWS::DeletePeer(shared_ptr<WsServer::Connection> hConnection, string email) {
    if (!email.empty()) {
        if (peerMap.find(email) != peerMap.end()) {
            if (pthread_mutex_lock(&peerMapLock) != 0) {
                cout << "DeletePeer: Unable to enquire lock" << endl;
                return;
            }
            SendPeersInfo(peerMap[email], "delpeer");
            delete peerMap[email];
            peerMap.erase(email);
            if (pthread_mutex_unlock(&peerMapLock) != 0) {
                cout << "DeletePeer: Unable to release lock" << endl;
                return;
            }
        }
    } else {
        cout << "DeletePeer: Empty Email String" << endl;
    }  
}


string WebSocketMainWS::FindPeerSameNetwork(shared_ptr<WsServer::Connection> hConnection) {
    json rNetworkPeers = {
        {"type", "responce"},
        {"module", "samenetwork"},
        {"devices", json::array()}
    };


    unordered_map<string, PeerData*>::iterator itr;
    for (itr = peerMap.begin(); itr != peerMap.end(); ++itr) { 
        PeerData* pData = itr->second;
        if (pData->m_hConnection.get() != hConnection.get()) {
            json device;
            device["email"] = pData->m_email;
            device["name"] = pData->m_name;
            device["privip"] = pData->m_privIP;
            device["pubip"] = pData->m_pubIP;
            device["devtype"] = pData->m_devType;
            device["devname"] = pData->m_devName;
            device["registered"] = pData->m_registered;
            rNetworkPeers["devices"].insert(rNetworkPeers["devices"].end(), device);    
        }
    }  
    return rNetworkPeers.dump();
}

void WebSocketMainWS::RelayMessages(shared_ptr<WsServer::Connection> hConnection, json msg){
    string email = hConnection->query_string;
    if (msg["from"].get<string>() ==  email) {
        string to = msg["to"].get<string>();
        if (peerMap.find(to) != peerMap.end()) {
            PeerData* pData = peerMap[to]; 
            SendMessage(pData->m_hConnection, msg.dump());
        }
    }
}

void WebSocketMainWS::SendPeersInfo(PeerData* pData, string type) {
    if (type.empty()) {
        return;
    }
    json info;
    json device;
    device["email"] = pData->m_email;
    device["name"] = pData->m_name;
    device["privip"] = pData->m_privIP;
    device["pubip"] = pData->m_pubIP;
    device["devtype"] = pData->m_devType;
    device["devname"] = pData->m_devName;
    device["registered"] = pData->m_registered;

    info["type"] = type;
    info["data"] = device;

    unordered_map<string, PeerData*>::iterator itr;
    for (itr = peerMap.begin(); itr != peerMap.end(); ++itr) { 
        PeerData* pDataMap = itr->second;
        if (pDataMap->m_hConnection.get() != pData->m_hConnection.get()) {
            pDataMap->m_hConnection->send(info.dump());   
        }
    } 
}

