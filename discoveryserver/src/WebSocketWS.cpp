#include "WebSocketWS.h"


WsServer WebSocketWS::server;

WebSocketWS::WebSocketWS () {

}
WebSocketWS::~WebSocketWS () {

}

void WebSocketWS::StartServerWS(uint32_t nPort, string sEndURL) {
  server.config.port = nPort;
  server.config.address = "0.0.0.0";
  server.config.thread_pool_size = 100;

  auto &echo = server.endpoint["^/"+ sEndURL + "/?$"];

  echo.on_message = [this, &echo](shared_ptr<WsServer::Connection> connection, shared_ptr<WsServer::InMessage> in_message) {
    string out_message = in_message->string();
    OnMessage(connection, out_message);
  };

  echo.on_open = [this](shared_ptr<WsServer::Connection> connection) {
    OnConnected(connection);
  };

  echo.on_close = [this](shared_ptr<WsServer::Connection> connection, int status, const string & /*reason*/) {
    OnDisconnected(connection);
  };

  echo.on_error = [this](shared_ptr<WsServer::Connection> connection, const SimpleWeb::error_code &ec) {
    OnError(connection, ec.message());
  };


  timer_start(std::bind(&WebSocketWS::NetworkDetection, this), 28000);
  timer_start(std::bind(&WebSocketWS::Pinging, this), 25000);

  server.start();
  
}


void WebSocketWS::SendMessage(shared_ptr<WsServer::Connection> hConnection, string sMessage) {
  hConnection->send(sMessage);
}

void WebSocketWS::timer_start(std::function<void(void)> func, unsigned int interval)
{
  std::thread([func, interval]()
  { 
    while (true)
    { 
      auto x = std::chrono::steady_clock::now() + std::chrono::milliseconds(interval);
      func();
      std::this_thread::sleep_until(x);
    }
  }).detach();
}

void WebSocketWS::Pinging() {
  for(auto &a_connection : server.get_connections()) {
    string peerid = a_connection->query_string;
    try {
        json ping = {{"type", "ping"}, {"peerid", peerid}};
        a_connection->send(ping.dump());
    } catch (json::exception& e) {
        continue;
    } 
  }

}
