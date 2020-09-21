#include "WebSocketMainWS.h"
#include "INIReader.h"

int main()
{
    INIReader reader("config.ini");
    if (reader.ParseError() != 0) {
        std::cout << "Can't load 'config.ini'\n";
        return 1;
    }

    int port = reader.GetInteger("server", "port", 8443);
    string url = reader.Get("server", "namespace", "");


    WebSocketWS* ws = new WebSocketMainWS;
    ws->StartServerWS(port, "server");

}
