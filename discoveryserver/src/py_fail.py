import subprocess 
import psutil
import time

if __name__ == "__main__":
    while (True):
        try:
            if "WebSocketWS" in (p.name() for p in psutil.process_iter()):
                time.sleep(20)
            else:
                print("Crashed Restarting")
                subprocess.call("/home/discoveryserver/src/server_restart.sh", shell=True)
        except BaseException as e:
            pass

                
