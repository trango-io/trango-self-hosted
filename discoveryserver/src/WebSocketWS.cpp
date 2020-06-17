#include "WebSocketWS.h"


WebSocketWS::WebSocketWS () {

}
WebSocketWS::~WebSocketWS () {

}

void WebSocketWS::StartServerWS(uint32_t nPort, string sEndURL) {
  WsServer server;
  server.config.port = nPort;
  server.config.address = "0.0.0.0";
  server.config.timeout_idle = 1200;
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


  server.start();
  
}


void WebSocketWS::SendMessage(shared_ptr<WsServer::Connection> hConnection, string sMessage) {
  hConnection->send(sMessage);
}
