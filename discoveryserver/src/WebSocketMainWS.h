using namespace std;
#include "WebSocketWS.h"
#include <unordered_map> 
#include <list> 
#include <iterator>
#include "json.hpp"
#include <boost/algorithm/string.hpp>

using json = nlohmann::json;


class PeerData {
    public:
        shared_ptr<WsServer::Connection> m_hConnection;
        string m_name;
        string m_email;
        string m_privIP;
        string m_pubIP;
        string m_devType;
        string m_devName;
        string m_roomID;
        bool m_isAlive = true;
        bool m_registered;
};

class WebSocketMainWS : public WebSocketWS {
    private:
        static pthread_mutex_t peerMapLock;
        static unordered_map<string, PeerData*> peerMap;
        bool RegisterPeer(shared_ptr<WsServer::Connection> hConnection, json data);
        void DeletePeer(shared_ptr<WsServer::Connection> hConnection, string email);
        string FindPeerSameNetwork(shared_ptr<WsServer::Connection> hConnection);
        void RelayMessages(shared_ptr<WsServer::Connection> hConnection, json msg);
        void SendPeersInfo(PeerData* pData, string type);
    public:
        void OnConnected(shared_ptr<WsServer::Connection> hConnection);
        void OnMessage(shared_ptr<WsServer::Connection> hConnection, string sMessage);
        void OnDisconnected(shared_ptr<WsServer::Connection> hConnection);
        void OnError(shared_ptr<WsServer::Connection> hConnection, string sError);
};

