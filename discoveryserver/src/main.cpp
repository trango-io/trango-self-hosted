#include "WebSocketMainWS.h"

int main()
{
    WebSocketWS* ws = new WebSocketMainWS;
    ws->StartServerWS(8443, "server");
}
