#include "WebSocketMainWS.h"

unordered_map<string, PeerData*> WebSocketMainWS::peerMap;
unordered_map<string, list<PeerData*>*> WebSocketMainWS::networkMap;
pthread_mutex_t WebSocketMainWS::peerMapLock = PTHREAD_MUTEX_INITIALIZER;
pthread_mutex_t WebSocketMainWS::networkMapLock = PTHREAD_MUTEX_INITIALIZER;

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
                                {"type", "register"}
                            };
                            rRegister["status"] = true;
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
                } else if (parsedMessage["type"] == "joinroom") {
                    if (parsedMessage.contains("roomid") && parsedMessage.contains("calltype")) {
                        JoinRoom(hConnection, parsedMessage["roomid"], parsedMessage["calltype"]);
                    }
                } else if (parsedMessage["type"] == "partroom") {
                    PartRoom(hConnection);
                } else if (parsedMessage["type"] == "disconnect") {
                    if (!parsedMessage["email"].empty()) {
                        if (peerMap.find(parsedMessage["email"]) != peerMap.end()) {
                            PeerData* pData = peerMap[parsedMessage["email"]];
                            OnDisconnected(pData->m_hConnection); 
                        }
                    }
                }  else if (parsedMessage["type"] == "pong") {
                    string peerid = parsedMessage["peerid"].get<string>();
                    pthread_mutex_lock(&peerMapLock);
                    if (peerMap.find(peerid) != peerMap.end()) {
                        PeerData* pData = peerMap[peerid];
                        if (hConnection.get() == pData->m_hConnection.get()) {
                            pData->m_isAlive = true;
                        }
                    }
                    pthread_mutex_unlock(&peerMapLock);
                } else if (parsedMessage["type"] == "checkurl") {
                    json resp = {
                        {"type", "checkurl"},
                        {"valid", false}
                    };

                    if (parsedMessage.contains("authKey")) {
                        if (CheckURL(parsedMessage["authKey"])) {
                            resp["valid"] = true;
                        } else {
                            resp["valid"] = false;
                        }
                    } else {
                        resp["valid"] = false;
                    }

                    SendMessage(hConnection, resp.dump());
                } else if (parsedMessage["type"] == "changename") {
                    if (parsedMessage.contains("name")) { 
                        WebSocketMainWS::ChangeName(hConnection, parsedMessage["name"]);
                    } else {
                        json rchangename = {
                            {"type", "changename"}
                        };
                        rchangename["status"] = false;
                        SendMessage(hConnection, rchangename.dump());
                    }
                } 
                else if (parsedMessage["type"] == "video" ) {
                        Video(hConnection); 
                }
            }

        } catch (json::exception& e) {
            cout << "message: " << e.what() << '\n' 
                << "exception id: " << e.id << std::endl;
        }
    }
}

void WebSocketMainWS::OnDisconnected(shared_ptr<WsServer::Connection> hConnection) {
    if (hConnection == NULL)
        return;

    string email = hConnection->query_string;
    string pubIP = hConnection->remote_endpoint().address().to_string();
    PartRoom(hConnection);
    DeletePeer(hConnection, email);
}
void WebSocketMainWS::OnError(shared_ptr<WsServer::Connection> hConnection, string sError) {
    try {
        string email = hConnection->query_string;
        string pubIP = hConnection->remote_endpoint().address().to_string();
        PartRoom(hConnection);
        DeletePeer(hConnection, email);
    } catch (...) {
        cout << "other exception" << endl;
    }

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
                        PeerData* pData = peerMap[email];
                        if (!pData->m_roomID.empty()) {
                            PartRoom(pData->m_hConnection);
                        }
                        pthread_mutex_lock(&peerMapLock);
                        pData->m_hConnection = hConnection;
                        pData->m_name = data["name"].get<string>();
                        pData->m_privIP = data["privip"].get<string>();
                        pData->m_devType = data["devtype"].get<string>();
                        pData->m_devName = data["devname"].get<string>();
                        pData->m_registered = data["registered"].get<bool>();
                        pData->m_roomID = "";
                        string pubIP = hConnection->remote_endpoint().address().to_string();
                        pData->m_pubIP = pubIP;
                        pthread_mutex_unlock(&peerMapLock);
                        SendPeersInfo(pData, "addpeer");
                        return true;
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

bool WebSocketMainWS::EmailCheck(string email) {
    const regex pattern("[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}");
    return regex_match(email,pattern);
}

void WebSocketMainWS::DeletePeer(shared_ptr<WsServer::Connection> hConnection, string email) {
    if (!email.empty()) {
        if (peerMap.find(email) != peerMap.end()) {
            if (pthread_mutex_lock(&peerMapLock) != 0) {
                cout << "DeletePeer: Unable to enquire lock" << endl;
                return;
            }
            SendPeersInfo(peerMap[email], "delpeer");
            // delete peerMap[email];
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
        {"type", "samenetwork"},
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


void WebSocketMainWS::JoinRoom(shared_ptr<WsServer::Connection> hConnection, string roomID, string callType) {
    string peerID = hConnection->query_string;

    json resp = {
            {"type", "joinroom"},
            {"joined", false},
            {"full", false}
    };

    json respJoin = {
        {"type", "peerjoined"}
    };

    if (roomID.empty() || peerID.empty() || callType.empty()) {
        SendMessage(hConnection, resp.dump());
        return;
    }

    if (networkMap.find(roomID) != networkMap.end()) {
        if (peerMap.find(peerID) != peerMap.end()) {
            PeerData* pData = peerMap[peerID];
            if (pData->m_hConnection.get() == hConnection.get()) {
                pthread_mutex_lock(&peerMapLock);
                pthread_mutex_lock(&networkMapLock); 
                list<PeerData*>* roomList = networkMap[roomID];
                if (roomList->size() < 4) {
                    if (callType == "audio") {
                        pData->video = false;
                    } else if (callType == "video") {
                        pData->video = true;
                    } else {
                        SendMessage(hConnection, resp.dump());
                        return;
                    }
                    pData->m_roomID = roomID;
                    roomList->push_back(pData);
                    resp["joined"] = true;
                    SendMessage(hConnection, resp.dump());
                } else {
                    resp["full"] = true;
                    pthread_mutex_unlock(&networkMapLock);
                    pthread_mutex_unlock(&peerMapLock);
                    SendMessage(hConnection, resp.dump());
                    return;
                }
                pthread_mutex_unlock(&networkMapLock);
                pthread_mutex_unlock(&peerMapLock);
                for (auto itr = roomList->begin(); itr != roomList->end(); itr++) {
                    PeerData* data = *itr;
                    if (data->m_hConnection.get() != hConnection.get()) {
                        respJoin["peerid"] = peerID;
                        respJoin["should_create_offer"] = false;
                        respJoin["name"] = pData->m_name;
                        respJoin["video"] = pData->video;
                        SendMessage(data->m_hConnection, respJoin.dump());
                        respJoin["peerid"] = data->m_email;
                        respJoin["should_create_offer"] = true;
                        respJoin["name"] = data->m_name;
                        respJoin["video"] = data->video;
                        SendMessage(hConnection, respJoin.dump());
                         
                    }
                }
            }
        } else {
            SendMessage(hConnection, resp.dump());
        }
    } else {
        if (peerMap.find(peerID) != peerMap.end()) {
        PeerData* pData = peerMap[peerID];
        if (pData->m_hConnection.get() == hConnection.get()) { 
            list<PeerData*>* roomList = new list<PeerData*>;
            roomList->push_back(pData);
            pthread_mutex_lock(&peerMapLock);
            pthread_mutex_lock(&networkMapLock);
            if (callType == "audio") {
                pData->video = false;
            } else if (callType == "video") {
                pData->video = true;
            } else {
                SendMessage(hConnection, resp.dump());
                return;
            }
            pData->m_roomID = roomID;
            networkMap[roomID] = roomList;
            pthread_mutex_unlock(&networkMapLock);
            pthread_mutex_unlock(&peerMapLock);
            resp["joined"] = true;
        }
        SendMessage(hConnection, resp.dump());
        } else {
            SendMessage(hConnection, resp.dump());
        }
    }
}


void WebSocketMainWS::PartRoom(shared_ptr<WsServer::Connection> hConnection) {
    string peerID = hConnection->query_string;

    json respRemove = {
        {"type", "peerparted"}
    };
    if (peerID.empty()) {
        return;
    }

    pthread_mutex_lock(&networkMapLock);
    pthread_mutex_lock(&peerMapLock);
    if (peerMap.find(peerID) != peerMap.end()) {
        PeerData* pData = peerMap[peerID];
        if (pData->m_hConnection.get() == hConnection.get()) {
            string roomID = pData->m_roomID;
            if (!roomID.empty()) {
                if (networkMap.find(roomID) != networkMap.end()) {
                    list<PeerData*>* roomList = networkMap[roomID];
                    for (auto roomitr = roomList->begin(); roomitr != roomList->end(); roomitr++) { 
                        PeerData* roomPData = *roomitr;
                        if (roomPData->m_hConnection.get() == hConnection.get()) {
                            roomitr = roomList->erase(roomitr);
                            break;
                        }
                    }

                    if (!roomList->empty()) {
                        for (auto roomitr = roomList->begin(); roomitr != roomList->end(); roomitr++) { 
                            PeerData* roomPData = *roomitr;
                            respRemove["roomid"] = roomID;
                            respRemove["peerid"] = peerID;
                            SendMessage(roomPData->m_hConnection, respRemove.dump());
                        }
                    }

                    if (roomList->empty()) {
                        networkMap.erase(roomID);
                    }
                }
            }
            }
    }
    pthread_mutex_unlock(&networkMapLock);
    pthread_mutex_unlock(&peerMapLock);
}

void WebSocketMainWS::NetworkDetection() {
    unordered_map<string, PeerData*>::iterator itr = peerMap.begin();
    while (itr != peerMap.end()) 
    { 
        string email = itr->first;
        PeerData* pData = itr->second;
        if (pData->m_isAlive ==  false) {
            string email = pData->m_email;
            if (!email.empty()) {
                if (peerMap.find(email) != peerMap.end()) {
                    if (pthread_mutex_lock(&peerMapLock) != 0) {
                        cout << "DeletePeer: Unable to enquire lock" << endl;
                        return;
                    }
                    //  delete peerMap[email];
                    SendPeersInfo(pData, "delpeer");
                    itr = peerMap.erase(itr);
                    if (pthread_mutex_unlock(&peerMapLock) != 0) {
                        cout << "DeletePeer: Unable to release lock" << endl;
                        return;
                    }
                }
            } else {
                cout << "DeletePeer: Empty Email String" << endl;
            } 
        } else {
            pthread_mutex_lock(&peerMapLock); 
            pData->m_isAlive = false;
            pthread_mutex_unlock(&peerMapLock); 
            itr++;    
        }  
    }
}

bool WebSocketMainWS::CheckURL(string authKey) {
    if (authKey == "z/EahGU31q1G5L14763UItXD6dI2X57RlUS7CI2n43g=") {
        return true;
    } else {
        return false;
    }
}

void WebSocketMainWS::Video(shared_ptr<WsServer::Connection> hConnection) {
    json event = {
        {"type", "video"}
    };

    string peerID = hConnection->query_string;
    bool enabled = false;
    string roomID = "";
    pthread_mutex_lock(&peerMapLock); 
    if (!peerID.empty()) {
        if (peerMap.find(peerID) != peerMap.end()) {
            PeerData* pData = peerMap[peerID];
            roomID = pData->m_roomID;
            pData->video = !pData->video;
            enabled = pData->video;
        }
    }
    if (!roomID.empty()) {
        if (networkMap.find(roomID) != networkMap.end()) {
            list<PeerData*>* roomList = networkMap[roomID];
            for (auto roomitr = roomList->begin(); roomitr != roomList->end(); roomitr++) { 
                PeerData* roomPData = *roomitr;
                if (roomPData->m_hConnection.get() != hConnection.get()) {
                    event["peerid"] = peerID;
                    event["enabled"] = enabled;
                    SendMessage(roomPData->m_hConnection, event.dump());
                } 
            }
        }
    }
    pthread_mutex_unlock(&peerMapLock); 
}

void WebSocketMainWS::ChangeName(shared_ptr<WsServer::Connection> hConnection, string name) {
    string email = hConnection->query_string;
    json rnamechanged = {
        {"type", "namechanged"}
    };
    json rchangename = {
        {"type", "changename"}
    };
    if (!email.empty() && !name.empty()) {
        if (peerMap.find(email) != peerMap.end()) {
            pthread_mutex_lock(&peerMapLock);
            PeerData* pData = peerMap[email];
            pData->m_name = name;

            rnamechanged["peerid"] = email;
            rnamechanged["name"] = name;

            unordered_map<string, PeerData*>::iterator itr;
            for (itr = peerMap.begin(); itr != peerMap.end(); ++itr) { 
                PeerData* pDataMap = itr->second;
                if (pDataMap->m_hConnection.get() != hConnection.get()) {
                    SendMessage(pDataMap->m_hConnection, rnamechanged.dump());  
                }
            }

            pthread_mutex_unlock(&peerMapLock);
            rchangename["status"] = true;
            SendMessage(hConnection, rchangename.dump());
        } else {
            rchangename["status"] = false;
            SendMessage(hConnection, rchangename.dump());
        }
    } else {
        rchangename["status"] = false;
        SendMessage(hConnection, rchangename.dump());
    }
}

